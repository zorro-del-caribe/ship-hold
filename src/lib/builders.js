const builders = require('ship-hold-querybuilder');
const QueryStream = require('pg-query-stream');
const {aggregate} = require('./util');

const iterator = gen => (...args) => {
	const iter = gen(...args);
	iter.next();
	return iter;
};

const aggregateSink = iterator(function * (builder, consumer) {
	const {primaryKey} = builder.model;
	const sink = consumer();
	const rels = builder[Symbol.iterator] === undefined ? [] : [...builder];
	const aggregateFunc = aggregate(rels);
	let current = [];
	let currentPrimaryKey = null;
	try {
		while (true) {
			const r = yield;
			currentPrimaryKey = currentPrimaryKey === null ? r[primaryKey] : currentPrimaryKey;
			if (r[primaryKey] !== currentPrimaryKey) {
				sink.next(aggregateFunc(current));
				current = [];
				currentPrimaryKey = r[primaryKey];
			}
			current.push(r);
		}
	} catch (e) {
		sink.throw(e);
	} finally {
		if (currentPrimaryKey !== null) {
			sink.next(aggregateFunc(current));
		}
		sink.return();
	}
});

// Here if we need decoration etc.
module.exports = (pool) => {
	// Todo add async iterable.
	const runner = {
		stream(params = {}, consumer) {
			const stream = this._stream(params);
			const iter = aggregateSink(this, iterator(consumer));
			stream.on('data', row => iter.next(row));
			stream.on('error', err => iter.throw(err));
			stream.on('end', () => iter.return());
		},
		_stream(params = {}) {
			const {text, values} = this.build(params);
			const stream = new QueryStream(text, values);
			pool.connect().then(client => {
				const release = () => client.release();
				stream.on('end', release);
				stream.on('error', release);
				client.query(stream);
			});
			return stream;
		},
		run(params = {}) {
			const rows = [];
			return new Promise((resolve, reject) => {
				this.stream(params, function * () {
					try {
						while (true) {
							const r = yield;
							rows.push(r);
						}
					} catch (e) {
						reject(e);
					} finally {
						resolve(rows);
					}
				});
			});
		}
	};
	const delegateToBuilder = builder => (...args) => Object.assign(builder(...args), runner);
	return {
		select: delegateToBuilder(builders.select),
		update: delegateToBuilder(builders.update),
		delete: delegateToBuilder(builders.delete),
		insert: delegateToBuilder(builders.insert),
		if: (...args) => builders.condition().if(...args)
	};
};