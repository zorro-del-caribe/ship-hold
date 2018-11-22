import { EntityService, RelationDefinition, WithRelations } from '../interfaces';
export declare const withRelation: (serviceToRelation: WeakMap<EntityService, RelationDefinition>, aliasToService: Map<string, EntityService>) => WithRelations<EntityService>;
