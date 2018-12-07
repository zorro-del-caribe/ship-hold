import * as QueryStream from 'pg-query-stream';
const iterator = (gen) => (...args) => {
    const iter = gen(...args);
    iter.next();
    return iter;
};
/**
 * Create a functional mixin to be applied to a builder to be able to run the query against an actual database connection
 * Note: the mixin is "stateless" (or at least the connection pool can and should be shared across builders) and therefore can be copied as is when cloning a builder
 * @param {DBConnectionsPool} pool
 * @returns {WithQueryRunnerMixin}
 */
export const withQueryRunner = (pool) => {
    const runner = {
        stream(consumer, params = {}, offset = 1) {
            const stream = this._stream(params);
            const iter = iterator(consumer)();
            stream.on('data', row => iter.next(row));
            stream.on('error', err => iter.throw(err));
            stream.on('end', () => iter.return());
        },
        _stream(params = {}, offset = 1) {
            const { text, values } = this.build(params, offset);
            const stream = new QueryStream(text, values);
            pool.connect().then(client => {
                const release = () => client.release();
                stream.on('end', release);
                stream.on('error', release);
                client.query(stream);
            });
            return stream;
        },
        debug(params = {}, offset = 1) {
            console.log(this.build(params, offset));
            return this.run(params, offset);
        },
        run(params = {}, offset = 1) {
            const rows = [];
            return new Promise((resolve, reject) => {
                // @ts-ignore
                this.stream(function* () {
                    try {
                        while (true) {
                            const r = yield;
                            rows.push(r);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                    finally {
                        resolve(rows);
                    }
                }, params, offset);
            });
        }
    };
    return (builder) => {
        return Object.assign(builder, runner);
    };
};
