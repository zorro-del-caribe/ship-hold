import { createPoolConnection } from './lib/connections';
import { buildersFactory } from './lib/builders';
import { serviceRegistry } from './lib/service-registry';
export const shiphold = (connect = {}) => {
    const connection = Object.assign({}, {
        host: 'localhost',
        port: 5432
    }, connect);
    const connector = createPoolConnection(connection);
    const builders = buildersFactory(connector);
    return Object.assign(serviceRegistry(builders), connector, builders);
};
