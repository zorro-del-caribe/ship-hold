import {DBConnectionsPool, RunnableQueryBuilder, WithQueryRunner} from '../interfaces';
import {Builder} from 'ship-hold-querybuilder';
import * as QueryStream from 'pg-query-stream';

const iterator = (gen: GeneratorFunction) => (...args: any[]): Iterator<any> => {
    const iter = gen(...args);
    iter.next();
    return iter;
};

export const withQueryRunner = (pool: DBConnectionsPool) => {
    const runner: WithQueryRunner = {
        stream(this: RunnableQueryBuilder, consumer, params = {}, offset = 1) {
            const stream = this._stream(params);
            const iter = iterator(consumer)();
            stream.on('data', row => iter.next(row));
            stream.on('error', err => iter.throw(err));
            stream.on('end', () => iter.return());
        },
        _stream(this: RunnableQueryBuilder, params = {}, offset = 1) {
            const {text, values} = this.build(params, offset);
            const stream = new QueryStream(text, values);
            pool.connect().then(client => {
                const release = () => client.release();
                stream.on('end', release);
                stream.on('error', release);
                client.query(stream);
            });
            return stream;
        },
        debug(this: RunnableQueryBuilder, params = {}, offset = 1) {
            console.log(this.build(params, offset));
            return this.run(params, offset);
        },
        run(this: RunnableQueryBuilder, params = {}, offset = 1) {
            const rows = [];
            return new Promise((resolve, reject) => {
                // @ts-ignore
                this.stream(function* () {
                    try {
                        while (true) {
                            const r = yield;
                            rows.push(r);
                        }
                    } catch (e) {
                        reject(e);
                    } finally {
                        resolve(rows);
                    }
                }, params, offset);
            });
        }
    };

    return <T extends Builder>(builder: T): WithQueryRunner & T => {
        return Object.assign(builder, runner);
    };
};
