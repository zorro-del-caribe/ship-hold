import {DeleteBuilder, InsertBuilder, NodeParam, SelectBuilder, UpdateBuilder} from 'ship-hold-querybuilder';
import {ShipHoldBuilders, WithConditionsBuilderFactory, WithQueryRunner} from './builders';
import {BelongsToManyRelationDefinition, buildRelation, RelationDefinition, RelationType} from './relations';

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

    belongsToMany(service: EntityService, pivot: EntityService | string, keyInPivot: string, alias?: string): WithRelations;

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
    include(...relations: any[]): SelectServiceBuilder;
}

const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', {value: this});
    return builder;
};

type RelationArgument = string | SelectServiceBuilder | EntityService

// todo typecast
const normalise = (aliasToService: Map<string, EntityService>) => (rel: RelationArgument): SelectServiceBuilder => {

    // Alias
    if (typeof rel === 'string') {
        const service = aliasToService.get(rel);
        return service.select();
    }

    // Builder
    if ('build' in rel) {
        return <SelectServiceBuilder>rel;
    }

    // Service
    return rel.select();
};

export const service = <T>(definition: EntityDefinition, sh: ShipHoldBuilders): EntityService => {
    const {table} = definition;
    const serviceToRelation = new WeakMap<EntityService, RelationDefinition>();
    const aliasToService = new Map<string, EntityService>();

    const withInclude = (builder: SelectServiceBuilder): SelectServiceBuilder & WithInclusion => Object.assign(builder, {
        include(...relations: any[]): SelectServiceBuilder {

            const newBuilder = relations
                .map(normalise(aliasToService))
                .map(r => r.noop())
                .reduce(buildRelation(sh),
                    serviceInstance.select(`"${table}".*`)
                        .with(table, builder)
                );

            // We need to re apply sort to ensure pagination for complex queries etc.
            // @ts-ignore
            newBuilder.node('orderBy', builder.node('orderBy'));

            // Makes it an entity builder
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
    }, {
        definition: {value: Object.freeze(definition)} // Todo should freeze deeply
    });

    return serviceInstance;
};
