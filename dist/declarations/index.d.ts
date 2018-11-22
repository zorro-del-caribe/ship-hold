import { PoolConfig } from 'pg';
import { DBConnectionsPool, ServiceRegistry, ShipHoldBuilders } from './interfaces';
export interface ShipHold extends ShipHoldBuilders, DBConnectionsPool, ServiceRegistry {
}
export declare const shiphold: (connect?: PoolConfig) => ShipHold;
