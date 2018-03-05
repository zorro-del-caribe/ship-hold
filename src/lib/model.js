'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _shipHoldQuerybuilder = require('ship-hold-querybuilder');

var _util = require('./util');

var _relations = require('./relations');

var _relations2 = _interopRequireDefault(_relations);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (definition, sh) => {
	const { table, name } = definition;

	const withModel = fn => (...args) => {
		const builder = fn(...args);
		Object.defineProperty(builder, 'model', { value: service });
		return builder;
	};

	const withInclude = selectBuilder => {
		return Object.assign(selectBuilder, {
			include: withModel((...args) => {
				const relationBuilders = (0, _util.normalizeInclude)(definition, sh, ...args);
				const selfRelation = {
					relation: 'self',
					attributes: (0, _util.normalizeAttributes)(selectBuilder),
					key: definition.primaryKey
				};
				selectBuilder.node('select', _shipHoldQuerybuilder.nodes.compositeNode().add('*'));

				let newQueryBuilder = Object.assign(sh.select(...selfRelation.attributes.map(as => as === '*' ? { value: `"${table}".${as}` } : { value: `"${table}"."${as}"`, as })).from({ value: selectBuilder, as: table }), {
					relation: selfRelation,
					[Symbol.iterator]() {
						return relationBuilders[Symbol.iterator]();
					}
				});

				// And orderBy before we create the join statements
				const orderBy = selectBuilder.node('orderBy');
				newQueryBuilder.node('orderBy', orderBy);

				newQueryBuilder = relationBuilders.reduce((acc, curr) => {
					const relation = (0, _relations2.default)(service, curr, sh);
					// Add select to the main query
					acc.select(...relation.selectFields);
					// Overwrite the main query builder based on relation configuration
					return relation.join(acc);
				}, newQueryBuilder);

				return withInclude(newQueryBuilder);
			})
		});
	};

	const service = {
		select: withModel((...args) => withInclude(sh.select(...args).from(table))),
		insert: withModel((...args) => sh.insert(...args).into(table).returning('*')),
		update: withModel((map = {}) => {
			const builder = sh.update(table).returning('*');

			for (const [key, value] of Object.entries(map)) {
				builder.set(key, value);
			}

			return builder;
		}),
		delete: withModel(() => sh.delete(table)),
		if: (...args) => sh.if(...args)
	};

	Object.defineProperties(service, {
		definition: { value: Object.freeze(definition) }, // Todo should freeze deeply
		name: { value: name },
		primaryKey: { value: definition.primaryKey }
	});

	return service;
};