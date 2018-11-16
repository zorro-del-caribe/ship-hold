import {Pool, PoolClient, QueryResult} from 'pg';
import {SQLQuery} from 'ship-hold-querybuilder';

export interface DBConnectionsPool {
    query: (q: SQLQuery) => Promise<QueryResult>;
    connect: () => Promise<PoolClient>;
    stop: () => Promise<void>;
}

export const createPoolConnection = (conf: any): DBConnectionsPool => {
    const pool: Pool = new Pool(conf);
    return {
        query(q) {
            return pool.query(q);
        },
        connect() {
            return pool.connect();
        },
        stop() {
            return pool.end();
        }
    };
};
