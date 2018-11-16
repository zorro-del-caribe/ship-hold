import { PoolClient, QueryResult } from 'pg';
import { SQLQuery } from 'ship-hold-querybuilder';
export interface DBConnectionsPool {
    query: (q: SQLQuery) => Promise<QueryResult>;
    connect: () => Promise<PoolClient>;
    stop: () => Promise<void>;
}
export declare const createPoolConnection: (conf: any) => DBConnectionsPool;
