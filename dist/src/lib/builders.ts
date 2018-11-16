import {
    select, insert, update, condition, delete as del, SelectBuilder, InsertBuilder, DeleteBuilder, UpdateBuilder,
    ConditionsBuilder, NodeParam, SQLComparisonOperator
} from 'ship-hold-querybuilder';
import * as QueryStream from 'pg-query-stream';
import {DBConnectionsPool} from './connections';

const iterator = (gen: GeneratorFunction) => (...args: any[]): Iterator<any> => {
    const iter = gen(...args);
    iter.next();
    return iter;
};

export interface WithQueryRunner {
    stream: (sink: GeneratorFunction, params?: object, offset?: number) => void;
    _stream: (params ?: object, offset?: number) => QueryStream;
    run: <T>(params ?: object, offset?: number) => Promise<T[]>;
    debug: <T>(params ?: object, offset?: number) => Promise<T[]>;
}

export interface ConditionsBuilderFactory {
    (leftOperand: NodeParam<any>,
     operator?: SQLComparisonOperator | NodeParam<any>,
     rightOperand?: NodeParam<any>): ConditionsBuilder<{}>;
}

export interface WithConditionsBuilderFactory {
    if: ConditionsBuilderFactory
}

export interface ShipHoldBuilders extends WithConditionsBuilderFactory {
    select: (...args: NodeParam<any>[]) => SelectBuilder & WithQueryRunner;
    update: (tableName: string) => UpdateBuilder & WithQueryRunner;
    insert: (map ?: object) => InsertBuilder & WithQueryRunner;
    delete: (tableName: string) => DeleteBuilder & WithQueryRunner;
}

type RunnableQueryBuilder = (SelectBuilder | UpdateBuilder | InsertBuilder | DeleteBuilder) & WithQueryRunner;

export const buildersFactory = (pool: DBConnectionsPool): ShipHoldBuilders => {

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

    const delegateToBuilder = (builderFactory) => (...args: any[]) => Object.assign(builderFactory(...args), runner);
    return {
        select: delegateToBuilder(select),
        update: delegateToBuilder(update),
        delete: delegateToBuilder(del),
        insert: delegateToBuilder(insert),
        if: (...args) => condition().if(...args)
    };
};
