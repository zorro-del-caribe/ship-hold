import {compositeNode, InsertBuilder, UpdateBuilder} from 'ship-hold-querybuilder';
import {
    buildRelation,
} from './relations';
import {withRelation} from './with-relations';
import {
    EntityDefinition,
    EntityService,
    RelationArgument,
    RelationDefinition,
    SelectServiceBuilder,
    ShipHoldBuilders, WithInclusion
} from '../interfaces';
import {normaliseInclude, setAsServiceBuilder} from './utils';

export const service = <T>(definition: EntityDefinition, sh: ShipHoldBuilders): EntityService => {
    const {table, name} = definition;
    const serviceToRelation = new WeakMap<EntityService, RelationDefinition>();
    const aliasToService = new Map<string, EntityService>();

    let setAsServiceB;

    const withInclude = (builder: SelectServiceBuilder): SelectServiceBuilder & WithInclusion => Object.assign(builder, {
        include(...relations: RelationArgument[]): SelectServiceBuilder {

            // todo we may need to (unset) pagination on "builder" in case we are in a nested include (ie if we have a parent)
            // todo therefore we also need to restrict the with query (for efficiency) depending on the relation with the parent
            const orderBy = builder.node('orderBy');
            const limit = builder.node('limit');

            builder.node('orderBy', compositeNode())
            builder.node('limit',compositeNode())

            const targetBuilder = setAsServiceB(sh.select(`"${name}".*`)
                .from(name)
                .with(name, builder), name);

            const newBuilder = relations
                .map(normaliseInclude(aliasToService, builder))
                .reduce(buildRelation(sh),
                    targetBuilder
                );

            // We need to re apply pagination settings to ensure pagination work for complex queries etc.
            newBuilder.node('orderBy', orderBy);
            newBuilder.node('limit', limit);


            console.log(newBuilder.build())

            return newBuilder;
        }
    });

    const ServicePrototype = Object.assign({
        select: (...args) => setAsServiceB(withInclude(<SelectServiceBuilder>sh
            .select(...args)
            .from(table))),
        insert: (...args) => setAsServiceB(<InsertBuilder>sh
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
        if: (leftOperand, ...rest) => sh.if(leftOperand, ...rest)
    }, withRelation(serviceToRelation, aliasToService));

    const serviceInstance = Object.create(ServicePrototype, {
        definition: {value: Object.freeze(definition)} // Todo should freeze deeply
    });

    setAsServiceB = setAsServiceBuilder(serviceInstance);

    return serviceInstance;
};
