import { SelectServiceBuilder } from './service';
export declare const enum RelationType {
    BELONGS_TO = "BELONGS_TO",
    HAS_ONE = "HAS_ONE",
    HAS_MANY = "HAS_MANY",
    BELONGS_TO_MANY = "BELONGS_TO_MANY"
}
export interface RelationDefinition {
    type: RelationType;
    alias: string;
    foreignKey?: string;
}
export declare const buildRelation: (target: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => import("ship-hold-querybuilder/dist/declarations/builders/with").WithClause;
