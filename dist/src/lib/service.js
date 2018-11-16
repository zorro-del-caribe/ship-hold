import { buildRelation } from './relations';
const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', { value: this });
    return builder;
};
export const service = (definition, sh) => {
    const { table } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToRelation = new Map();
    const withInclude = (builder) => Object.assign(builder, {
        include(...relations) {
            const newBuilder = relations.reduce(buildRelation, serviceInstance.select(`"${table}".*`)
                .with(table, builder));
            // we need to re apply sort to ensure pagination for complex queries etc.
            // @ts-ignore //todo
            newBuilder.node('orderBy', builder.node('orderBy'));
            // makes it an entity builder
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
            aliasToRelation.set(label, relation);
            return this;
        },
        hasMany(service, alias) {
            const label = alias || service.definition.name.toLowerCase();
            const relation = {
                type: "HAS_MANY" /* HAS_MANY */,
                alias: label
            };
            serviceToRelation.set(service, relation);
            aliasToRelation.set(label, relation);
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
            aliasToRelation.set(label, relation);
            return this;
        },
        getRelationWith(key) {
            const rel = typeof key === 'string' ? aliasToRelation.get(key) : serviceToRelation.get(key);
            if (!rel) {
                throw new Error(`Could not find a relation between ${this.definition.name} and ${typeof key === 'string' ? key : key.definition.name}`);
            }
            return rel;
        }
    }, {
        definition: { value: Object.freeze(definition) } // Todo should freeze deeply
    });
    return serviceInstance;
};
