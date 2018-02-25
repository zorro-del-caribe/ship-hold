const connectorFactory = require('./lib/connections');
const buildersFactory = require('./lib/builders');
const modelRegistryFactory = require('./lib/model-registry');

module.exports = function (connect = {}) {
	const connection = Object.assign({}, {
		host: 'localhost',
		port: 5432
	}, connect);

	const connector = connectorFactory(connection);
	const builders = buildersFactory(connector);
	return Object.assign(modelRegistryFactory(), connector, builders);
};