import {Pool} from 'pg';
import {DBConnectionsPool} from '../interfaces';

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
