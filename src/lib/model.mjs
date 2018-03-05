import shqb from 'ship-hold-querybuilder';
import {normalizeInclude, normalizeAttributes} from './util';
import relationFactory from './relations';

export default (definition, sh) => {
	const {table, name} = definition;

	const withModel = fn => (...args) => {
		const builder = fn(...args);
		Object.defineProperty(builder, 'model', {value: service});
		return builder;
	};

	const withInclude = selectBuilder => Object.assign(selectBuilder, {
		include: withModel((...args) => {
			const {nodes} = shqb;
			const relationBuilders = normalizeInclude(definition, sh, ...args);
			const selfRelation = {
				relation: 'self',
				attributes: normalizeAttributes(selectBuilder),
				key: selectBuilder.model.primaryKey
			};

			selectBuilder.node('select', nodes.compositeNode().add('*'));

			let newQueryBuilder = Object.assign(sh
				.select(...selfRelation.attributes.map(as => as === '*' ?
					{value: `"${table}".${as}`} :
					{value: `"${table}"."${as}"`, as}))
				.from({value: selectBuilder, as: table}), {
				relation: selfRelation
			});

			// And orderBy before we create the join statements
			const orderBy = selectBuilder.node('orderBy');
			newQueryBuilder.node('orderBy', orderBy);

			newQueryBuilder = relationBuilders.reduce((acc, curr) => {
				const relation = relationFactory(service, curr, sh);
				// Add select to the main query
				acc.select(...relation.selectFields);
				// Overwrite the main query builder based on relation configuration
				return relation.join(acc);
			}, newQueryBuilder);

			return withInclude(Object.assign(newQueryBuilder, {
				[Symbol.iterator]() {
					return relationBuilders[Symbol.iterator]();
				}
			}));
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
		definition: {value: Object.freeze(definition)}, // Todo should freeze deeply
		name: {value: name},
		primaryKey: {value: definition.primaryKey}
	});

	return service;
};
