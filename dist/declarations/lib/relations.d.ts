import { SelectServiceBuilder } from './service';
import { Buildable } from 'ship-hold-querybuilder';
import { ShipHoldBuilders } from './builders';
export declare const enum RelationType {
    BELONGS_TO = "BELONGS_TO",
    HAS_ONE = "HAS_ONE",
    HAS_MANY = "HAS_MANY",
    BELONGS_TO_MANY = "BELONGS_TO_MANY"
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
export interface InclusionParameter {
    builder: Buildable;
    as: string;
}
export declare const buildRelation: (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => any;
