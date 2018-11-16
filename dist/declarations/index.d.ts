import { DBConnectionsPool } from './lib/connections';
import { ShipHoldBuilders } from './lib/builders';
import { ServiceRegistry } from './lib/service-registry';
import { PoolConfig } from 'pg';
export interface ShipHold extends ShipHoldBuilders, DBConnectionsPool, ServiceRegistry {
}
export declare const shiphold: (connect?: PoolConfig) => ShipHold;
