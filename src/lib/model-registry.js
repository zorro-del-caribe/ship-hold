const define = require('./relation-definitions');
const modelFactory = require('./model');
const {ok} = require('assert');

const normalizeColumns = columns => {
	const columnsDef = {};
	for (const column of Object.keys(columns)) {
		const def = columns[column];
		columnsDef[column] = typeof def === 'string' ? {type: def} : def;
	}
	return columnsDef
};

// Create a map of model services
module.exports = () => {
	const instance = {};
	const registry = Object.create(null);

	const getModel = (name) => {
		ok(registry[name], `could not find the model ${name}`);
		return registry[name];
	};
	const setModel = function (name, defFunc) {
		const definition = defFunc(define);
		definition.columns = normalizeColumns(definition.columns);
		definition.primaryKey = definition.primaryKey || 'id';
		definition.name = name;
		registry[name] = modelFactory(definition, instance);
		return getModel(name);
	};

	return Object.assign(instance, {
		[Symbol.iterator]: () => Object.entries(registry)[Symbol.iterator](),
		model(name, defFunc) {
			return defFunc === undefined ? getModel(name) : setModel(name, defFunc);
		}
	});
};
