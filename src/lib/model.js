const runner = require('./runner');
const util = require('./util');
const relationFactory = require('./relations');
const shqb = require('ship-hold-querybuilder');

module.exports = (definition, sh) => {
	const {table, name} = definition;

	const withModel = fn => (...args) => {
		const builder = fn(...args);
		Object.defineProperty(builder, 'model', {value: service});
		return builder
	};

	const withInclude = selectBuilder => Object.assign(selectBuilder, {
		include: withModel((...args) => {
			const {nodes} = shqb;
			const relationBuilders = util.normalizeInclude(definition, sh, ...args);

			// modify select fields
			const selectedFields = [...selectBuilder.node('select')].map(f => f.value === '*' ? {value: table + '.*'} : {
				value: [table, f.value].join('.'),
				as: f.value
			});
			selectBuilder.node('select', nodes.compositeNode().add('*'));

			let newQueryBuilder = sh
				.select(...selectedFields)
				.from({value: selectBuilder, as: table});

			// and orderBy before we create the join statements
			const orderBy = selectBuilder.node('orderBy');
			newQueryBuilder.node('orderBy', nodes
				.compositeNode({separator: ', '})
				.add(...orderBy)
			);

			newQueryBuilder = relationBuilders.reduce((acc, curr) => {
				const relation = relationFactory(service, curr, sh);
				// Add select to the main query
				acc.select(...relation.selectFields());
				// Overwrite the main query builder based on relation configuration
				return relation.join(acc);
			}, newQueryBuilder);

			return withInclude(newQueryBuilder, {
				[Symbol.iterator]() {
					return relationBuilders[Symbol.iterator]();
				}
			});
		})
	});

	const service = {
		select: withModel((...args) => withInclude(sh
			.select(...args)
			.from(table))),
		insert: withModel((...args) => sh
			.insert(...args)
			.into(table)
			.returning('*')),
		update: withModel((map = {}) => {
			const builder = sh
				.update(table)
				.returning('*');

			for (const [key, value] of Object.entries(map)) {
				builder.set(key, value);
			}

			return builder;
		}),
		delete: withModel(() => sh.delete(table)),
		if: (...args) => sh.if(...args)
	};

	Object.defineProperties(service, {
		definition: {value: Object.freeze(definition)}, // todo should freeze deeply
		name: {value: name},
		primaryKey: {value: definition.primaryKey}
	});

	return service;
};