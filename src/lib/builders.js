const builders = require('ship-hold-querybuilder');
const QueryStream = require('pg-query-stream');

// Here if we need decoration etc.
module.exports = (pool) => {
	// Todo add async iterable.
	const runner = {
		stream(params) {
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
		async run(params = {}) {
			const {rows} = await pool.query(this.build(params));
			return rows;
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