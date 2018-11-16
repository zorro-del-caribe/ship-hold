import { select, insert, update, condition, delete as del } from 'ship-hold-querybuilder';
import * as QueryStream from 'pg-query-stream';
const iterator = (gen) => (...args) => {
    const iter = gen(...args);
    iter.next();
    return iter;
};
export const buildersFactory = (pool) => {
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
    const delegateToBuilder = (builderFactory) => (...args) => Object.assign(builderFactory(...args), runner);
    return {
        select: delegateToBuilder(select),
        update: delegateToBuilder(update),
        delete: delegateToBuilder(del),
        insert: delegateToBuilder(insert),
        if: (...args) => condition().if(...args)
    };
};
