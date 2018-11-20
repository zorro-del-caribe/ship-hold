import { DeleteBuilder, InsertBuilder, NodeParam, SelectBuilder, UpdateBuilder } from 'ship-hold-querybuilder';
import { ShipHoldBuilders, WithConditionsBuilderFactory, WithQueryRunner } from './builders';
import { RelationDefinition } from './relations';
export interface EntityDefinition {
    table: string;
    name: string;
    primaryKey?: string;
}
export interface EntityBuilder {
    service: EntityService;
}
export interface SelectServiceBuilder extends SelectBuilder, WithQueryRunner, EntityBuilder {
}
export interface UpdateServiceBuilder extends UpdateBuilder, WithQueryRunner, EntityBuilder {
}
export interface DeleteServiceBuilder extends DeleteBuilder, WithQueryRunner, EntityBuilder {
}
export interface InsertServiceBuilder extends InsertBuilder, WithQueryRunner, EntityBuilder {
}
export interface WithRelations {
    belongsTo(service: EntityService, foreignKey: string, alias?: string): WithRelations;
    hasMany(service: EntityService, alias?: string): WithRelations;
    hasOne(service: EntityService, alias?: string): WithRelations;
    belongsToMany(service: EntityService, pivot: EntityService | string, keyInPivot: string, alias?: string): WithRelations;
    getRelationWith(rel: EntityService | string): RelationDefinition;
}
export interface EntityService extends WithConditionsBuilderFactory, WithRelations {
    readonly definition: EntityDefinition;
    select: (...args: NodeParam<any>[]) => SelectServiceBuilder;
    update: (map?: object) => UpdateServiceBuilder;
    delete: () => DeleteServiceBuilder;
    insert: (map?: object) => InsertServiceBuilder;
}
export interface WithInclusion {
    include(...relations: any[]): SelectServiceBuilder;
}
export declare const service: <T>(definition: EntityDefinition, sh: ShipHoldBuilders) => EntityService;
