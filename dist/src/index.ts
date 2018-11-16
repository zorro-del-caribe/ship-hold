import {createPoolConnection, DBConnectionsPool} from './lib/connections';
import {ShipHoldBuilders, buildersFactory} from './lib/builders';
import {serviceRegistry, ServiceRegistry} from './lib/service-registry';
import {PoolConfig} from 'pg';

export interface ShipHold extends ShipHoldBuilders, DBConnectionsPool, ServiceRegistry {
}

export const shiphold = (connect: PoolConfig = {}): ShipHold => {
    const connection = Object.assign({}, {
        host: 'localhost',
        port: 5432
    }, connect);

    const connector = createPoolConnection(connection);
    const builders = buildersFactory(connector);
    return Object.assign(serviceRegistry(builders), connector, builders);
};
