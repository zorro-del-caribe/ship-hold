import {
    EntityService,
    BelongsToManyRelationDefinition,
    RelationDefinition,
    RelationType,
    WithRelations
} from '../interfaces';

/**
 * Mixin to be applied to an Entity Service
 * @param {WeakMap<EntityService, RelationDefinition>} serviceToRelation
 * @param {Map<string, EntityService>} aliasToService
 * @returns {WithRelations<EntityService>}
 */
export const withRelation = (
    serviceToRelation: WeakMap<EntityService, RelationDefinition>,
    aliasToService: Map<string, EntityService>
): WithRelations<EntityService> => {
    return {
        hasOne(service: EntityService, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: RelationType.HAS_ONE,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        hasMany(service: EntityService, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: RelationType.HAS_MANY,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        belongsTo(service: EntityService, foreignKey, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: RelationType.BELONGS_TO,
                alias: label,
                foreignKey
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        belongsToMany(service: EntityService, pivot: EntityService | string, keyInPivot: string, alias?: string) {
            const pivotTable = typeof pivot === 'string' ? pivot : pivot.definition.table;
            const label = alias || service.definition.name.toLowerCase();
            const relation: BelongsToManyRelationDefinition = {
                type: RelationType.BELONGS_TO_MANY,
                alias: label,
                pivotTable,
                pivotKey: keyInPivot
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(label, service);
            return this;
        },
        getRelationWith(key: EntityService | string) {

            if (typeof key === 'string') {
                return this.getRelationWith(aliasToService.get(key));
            }

            if (!serviceToRelation.has(key)) {
                const message = `Could not find a relation between ${this.definition.name} and ${key.definition.name}`;
                throw new Error(message);
            }

            return serviceToRelation.get(key);
        }
    };
};
