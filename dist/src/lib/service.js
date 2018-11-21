import { buildRelation } from './relations';
const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', { value: this });
    return builder;
};
const isNormalized = (val) => {
    return typeof val === 'object' && 'as' in val;
};
const normaliseInclude = (aliasToService, targetBuilder) => (rel) => {
    if (isNormalized(rel)) {
        return rel;
    }
    // Alias
    if (typeof rel === 'string') {
        const service = aliasToService.get(rel);
        return { builder: service.select(), as: rel };
    }
    const builder = ('build' in rel ? rel : rel.select()).noop();
    const as = targetBuilder.service.getRelationWith(builder.service).alias;
    return {
        builder: builder,
        as
    };
};
export const service = (definition, sh) => {
    const { table, name } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    const setAsServiceBuilder = (builder) => Object.defineProperty(builder, 'service', { value: serviceInstance });
    const withInclude = (builder) => Object.assign(builder, {
        include(...relations) {
            const targetBuilder = setAsServiceBuilder(sh.select(`"${name}".*`)
                .from(name)
                .with(name, builder));
            const newBuilder = relations
                .map(normaliseInclude(aliasToService, builder))
                .reduce(buildRelation(sh), targetBuilder);
            // We need to re apply sort to ensure pagination for complex queries etc.
            newBuilder.node('orderBy', builder.node('orderBy'));
            // Makes it an entity builder
            Object.defineProperty(newBuilder, 'service', { value: serviceInstance });
            return newBuilder;
        }
    });
    const serviceInstance = Object.create({
        select: withService((...args) => withInclude(sh
            .select(...args)
            .from(table))),
        insert: withService((...args) => sh
            .insert(...args)
            .into(table)
            .returning('*')),
        update: withService((map = {}) => {
            const builder = sh
                .update(table)
                .returning('*');
            for (const [key, value] of Object.entries(map)) {
                builder.set(key, value);
            }
            return builder;
        }),
        delete: withService(() => sh.delete(table)),
        if: (leftOperand, ...rest) => sh.if(leftOperand, ...rest),
        hasOne(service, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: "HAS_ONE" /* HAS_ONE */,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        hasMany(service, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: "HAS_MANY" /* HAS_MANY */,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        belongsTo(service, foreignKey, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: "BELONGS_TO" /* BELONGS_TO */,
                alias: label,
                foreignKey
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(alias, service);
            return this;
        },
        belongsToMany(service, pivot, keyInPivot, alias) {
            const pivotTable = typeof pivot === 'string' ? pivot : pivot.definition.table;
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: "BELONGS_TO_MANY" /* BELONGS_TO_MANY */,
                alias: label,
                pivotTable,
                pivotKey: keyInPivot
            };
            serviceToRelation.set(service, relation);
            aliasToService.set(label, service);
            return this;
        },
        getRelationWith(key) {
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
        definition: { value: Object.freeze(definition) } // Todo should freeze deeply
    });
    return serviceInstance;
};
