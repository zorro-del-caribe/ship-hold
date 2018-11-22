import { SQLQuery } from 'ship-hold-querybuilder';
import { PoolClient, QueryResult } from 'pg';
export interface DBConnectionsPool {
    query: (q: SQLQuery) => Promise<QueryResult>;
    connect: () => Promise<PoolClient>;
    stop: () => Promise<void>;
}
