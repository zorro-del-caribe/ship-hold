import {InsertBuilder, UpdateBuilder} from 'ship-hold-querybuilder';
import {withRelation} from './with-relations-service-mixin';
import {
    EntityDefinition,
    EntityService,
    RelationDefinition,
    SelectServiceBuilder,
    ShipHoldBuilders
} from '../interfaces';
import {withInclude} from './with-include-builder-mixin';
import {setAsServiceBuilder, WithServiceBuilderMixin} from './with-service-builder-mixin';

export const service = <T>(definition: EntityDefinition, sh: ShipHoldBuilders): EntityService => {
    const {table} = definition;
    const serviceToRelation = new WeakMap<EntityService, RelationDefinition>();
    const aliasToService = new Map<string, EntityService>();
    const include = withInclude(aliasToService, sh);

    let setAsServiceB: WithServiceBuilderMixin;

    const ServicePrototype = Object.assign({
            rawSelect: (...args: any[]) => {
                return setAsServiceB(include(<SelectServiceBuilder>sh
                    .select(...args)));
            },

            select: (...args: any[]) => {
                return setAsServiceB(include(<SelectServiceBuilder>sh
                    .select(...args)
                    .from(table)));
            },

            insert: (...args: any[]) => setAsServiceB(<InsertBuilder>sh
                .insert(...args)
                .into(table)
                .returning('*')),

            update: (map = {}) => {
                const builder = <UpdateBuilder>sh
                    .update(table)
                    .returning('*');

                for (const [key, value] of Object.entries(map)) {
                    builder.set(key, value);
                }

                return setAsServiceB(builder);
            },

            delete: () => setAsServiceB(sh.delete(table)),

            if: (leftOperand: any, ...rest: any[]) => sh.if(leftOperand, ...rest)
        },
        withRelation(serviceToRelation, aliasToService)
    );

    const serviceInstance = Object.create(ServicePrototype, {
        definition: {value: Object.freeze(definition)}
    });

    setAsServiceB = setAsServiceBuilder(serviceInstance);

    return serviceInstance;
};
