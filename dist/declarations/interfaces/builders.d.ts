import * as QueryStream from 'pg-query-stream';
import { Builder, ConditionsBuilder, DeleteBuilder, InsertBuilder, NodeParam, SelectBuilder, SQLComparisonOperator, UpdateBuilder } from 'ship-hold-querybuilder';
import { InclusionInput, WithRelations } from './relations';
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
export interface EntityDefinition {
    table: string;
    name?: string;
    primaryKey?: string;
}
export interface EntityBuilder {
    readonly service: EntityService;
    readonly cte: string;
    readonly primaryKey?: string;
}
export interface SelectServiceBuilder extends WithInclusion<SelectServiceBuilder>, WithQueryRunner, EntityBuilder {
}
export interface UpdateServiceBuilder extends UpdateBuilder, WithQueryRunner, EntityBuilder {
}
export interface DeleteServiceBuilder extends DeleteBuilder, WithQueryRunner, EntityBuilder {
}
export interface InsertServiceBuilder extends InsertBuilder, WithQueryRunner, EntityBuilder {
}
export interface EntityService extends WithConditionsBuilderFactory, WithRelations<EntityService> {
    readonly definition: EntityDefinition;
    rawSelect: (...args: NodeParam<any>[]) => SelectServiceBuilder;
    select: (...args: NodeParam<any>[]) => SelectServiceBuilder;
    update: (map?: object) => UpdateServiceBuilder;
    delete: () => DeleteServiceBuilder;
    insert: (map?: object) => InsertServiceBuilder;
}
export interface WithInclusion<T> extends SelectBuilder {
    readonly inclusions: InclusionInput[];
    include(...relations: any[]): WithInclusion<T> & T;
    clone(deep?: boolean): WithInclusion<T> & T;
    toBuilder(): WithInclusion<T> & T;
}
export interface ShipHoldBuilders extends WithConditionsBuilderFactory {
    select: (...args: NodeParam<any>[]) => SelectBuilder & WithQueryRunner;
    update: (tableName: string) => UpdateBuilder & WithQueryRunner;
    insert: (map?: object) => InsertBuilder & WithQueryRunner;
    delete: (tableName: string) => DeleteBuilder & WithQueryRunner;
}
export declare type RunnableQueryBuilder = Builder & WithQueryRunner;
