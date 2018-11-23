import { EntityService, RelationDefinition, WithRelations } from '../interfaces';
/**
 * Mixin to be applied to an Entity Service
 * @param {WeakMap<EntityService, RelationDefinition>} serviceToRelation
 * @param {Map<string, EntityService>} aliasToService
 * @returns {WithRelations<EntityService>}
 */
export declare const withRelation: (serviceToRelation: WeakMap<EntityService, RelationDefinition>, aliasToService: Map<string, EntityService>) => WithRelations<EntityService>;
