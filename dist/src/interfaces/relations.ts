import {SelectServiceBuilder} from './builders';
import {EntityService} from './index';

export const enum RelationType {
    BELONGS_TO = 'BELONGS_TO',
    HAS_ONE = 'HAS_ONE',
    HAS_MANY = 'HAS_MANY',
    BELONGS_TO_MANY = 'BELONGS_TO_MANY'
}

export interface RelationDefinition {
    type: RelationType;
    alias: string;
}

export interface BelongsToRelationDefinition extends RelationDefinition {
    foreignKey: string;
}

export interface BelongsToManyRelationDefinition extends RelationDefinition {
    pivotTable: string;
    pivotKey: string;
}

export interface InclusionInput {
    builder: SelectServiceBuilder;
    as: string
}

export interface WithRelations<T> {
    belongsTo(this: WithRelations<T> & T, service: T, foreignKey: string, alias?: string): WithRelations<T> & T;

    hasMany(this: WithRelations<T> & T, service: T, alias?: string): WithRelations<T> & T;

    hasOne(this: WithRelations<T> & T, service: T, alias?: string): WithRelations<T> & T;

    belongsToMany(this: WithRelations<T> & T, service: T, pivot: T | string, keyInPivot: string, alias?: string): WithRelations<T> & T;

    getRelationWith(this: WithRelations<T> & T, rel: T | string): RelationDefinition;
}

export type RelationArgument = InclusionInput | string | SelectServiceBuilder | EntityService;
