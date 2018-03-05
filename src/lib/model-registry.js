'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assert = require('assert');

var _relationDefinitions = require('./relation-definitions');

var _relationDefinitions2 = _interopRequireDefault(_relationDefinitions);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const normalizeColumns = columns => {
	const columnsDef = {};
	for (const column of Object.keys(columns)) {
		const def = columns[column];
		columnsDef[column] = typeof def === 'string' ? { type: def } : def;
	}
	return columnsDef;
};

// Create a map of model services

exports.default = () => {
	const instance = {};
	const registry = Object.create(null);
	const getModel = name => {
		(0, _assert.ok)(registry[name], `could not find the model ${name}`);
		return registry[name];
	};
	const setModel = function (name, defFunc) {
		const definition = Object.assign({ relations: {} }, defFunc(_relationDefinitions2.default));
		definition.columns = normalizeColumns(definition.columns);
		definition.primaryKey = definition.primaryKey || 'id';
		definition.name = name;
		registry[name] = (0, _model2.default)(definition, instance);
		return getModel(name);
	};

	return Object.assign(instance, {
		[Symbol.iterator]: () => Object.entries(registry)[Symbol.iterator](),
		model(name, defFunc) {
			return defFunc === undefined ? getModel(name) : setModel(name, defFunc);
		}
	});
};