import connectorFactory from './lib/connections';
import buildersFactory from './lib/builders';
import modelRegistryFactory from './lib/model-registry';

export default (connect = {}) => {
	const connection = Object.assign({}, {
		host: 'localhost',
		port: 5432
	}, connect);

	const connector = connectorFactory(connection);
	const builders = buildersFactory(connector);
	return Object.assign(modelRegistryFactory(), connector, builders);
};
