import { SelectBuilder, InsertBuilder, DeleteBuilder, UpdateBuilder, ConditionsBuilder, NodeParam, SQLComparisonOperator } from 'ship-hold-querybuilder';
import * as QueryStream from 'pg-query-stream';
import { DBConnectionsPool } from './connections';
export interface WithQueryRunner {
    stream: (sink: GeneratorFunction, params?: object, offset?: number) => void;
    _stream: (params?: object, offset?: number) => QueryStream;
    run: <T>(params?: object, offset?: number) => Promise<T[]>;
    debug: <T>(params?: object, offset?: number) => Promise<T[]>;
}
export interface ConditionsBuilderFactory {
    (leftOperand: NodeParam<any>, operator?: SQLComparisonOperator | NodeParam<any>, rightOperand?: NodeParam<any>): ConditionsBuilder<{}>;
}
export interface WithConditionsBuilderFactory {
    if: ConditionsBuilderFactory;
}
export interface ShipHoldBuilders extends WithConditionsBuilderFactory {
    select: (...args: NodeParam<any>[]) => SelectBuilder & WithQueryRunner;
    update: (tableName: string) => UpdateBuilder & WithQueryRunner;
    insert: (map?: object) => InsertBuilder & WithQueryRunner;
    delete: (tableName: string) => DeleteBuilder & WithQueryRunner;
}
export declare const buildersFactory: (pool: DBConnectionsPool) => ShipHoldBuilders;
