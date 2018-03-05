'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _connections = require('./lib/connections');

var _connections2 = _interopRequireDefault(_connections);

var _builders = require('./lib/builders');

var _builders2 = _interopRequireDefault(_builders);

var _modelRegistry = require('./lib/model-registry');

var _modelRegistry2 = _interopRequireDefault(_modelRegistry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (connect = {}) => {
	const connection = Object.assign({}, {
		host: 'localhost',
		port: 5432
	}, connect);

	const connector = (0, _connections2.default)(connection);
	const builders = (0, _builders2.default)(connector);
	return Object.assign((0, _modelRegistry2.default)(), connector, builders);
};