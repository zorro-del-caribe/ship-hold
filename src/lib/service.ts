import {DeleteBuilder, InsertBuilder, NodeParam, SelectBuilder, UpdateBuilder} from 'ship-hold-querybuilder';
import {ShipHoldBuilders, WithConditionsBuilderFactory, WithQueryRunner} from './builders';
import {buildRelation, RelationDefinition, RelationType} from './relations';

export interface EntityDefinition {
    table: string;
    name: string;
    primaryKey?: string;
}

export interface EntityBuilder {
    service: EntityService
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

    getRelationWith(rel: EntityService | string): RelationDefinition;
}

export interface EntityService extends WithConditionsBuilderFactory, WithRelations {
    readonly definition: EntityDefinition;
    select: (...args: NodeParam<any>[]) => SelectServiceBuilder;
    update: (map ?: object) => UpdateServiceBuilder;
    delete: () => DeleteServiceBuilder;
    insert: (map ?: object) => InsertServiceBuilder;
}

export interface WithInclusion {
    include(...relations: SelectServiceBuilder[]): SelectServiceBuilder;
}

const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', {value: this});
    return builder;
};

export const service = <T>(definition: EntityDefinition, sh: ShipHoldBuilders): EntityService => {
    const {table} = definition;
    const serviceToRelation = new WeakMap<EntityService, RelationDefinition>();
    const aliasToRelation = new Map<string, RelationDefinition>();

    const withInclude = (builder: SelectServiceBuilder): SelectServiceBuilder & WithInclusion => Object.assign(builder, {
        include(...relations: SelectServiceBuilder[]): SelectServiceBuilder {

            const newBuilder = relations.reduce(buildRelation,
                serviceInstance.select(`"${table}".*`)
                    .with(table, builder)
            );

            // we need to re apply sort to ensure pagination for complex queries etc.
            // @ts-ignore //todo
            newBuilder.node('orderBy', builder.node('orderBy'));

            // makes it an entity builder
            Object.defineProperty(newBuilder, 'service', {value: serviceInstance});

            return newBuilder;
        }

    });

    const serviceInstance = Object.create({
        select: withService((...args) => withInclude(<SelectServiceBuilder>sh
            .select(...args)
            .from(table))),
        insert: withService((...args) => (<InsertBuilder>sh
            .insert(...args)
            .into(table))
            .returning('*')),
        update: withService((map = {}) => {
            const builder = <UpdateBuilder>sh
                .update(table)
                .returning('*');

            for (const [key, value] of Object.entries(map)) {
                builder.set(key, value);
            }

            return builder;
        }),
        delete: withService(() => sh.delete(table)),
        if: (leftOperand: NodeParam<any>, ...rest: any[]) => sh.if(leftOperand, ...rest),
        hasOne(service: EntityService, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: RelationType.HAS_ONE,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToRelation.set(label, relation);
            return this;
        },
        hasMany(service: EntityService, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: RelationType.HAS_MANY,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToRelation.set(label, relation);
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
            aliasToRelation.set(label, relation);
            return this;
        },
        getRelationWith(key: EntityService | string) {
            const rel = typeof key === 'string' ? aliasToRelation.get(key) : serviceToRelation.get(key);
            if (!rel) {
                throw new Error(
                    `Could not find a relation between ${this.definition.name} and ${typeof key === 'string' ? key : key.definition.name}`
                );
            }
            return rel;
        }
    }, {
        definition: {value: Object.freeze(definition)} // Todo should freeze deeply
    });

    return serviceInstance;
};
