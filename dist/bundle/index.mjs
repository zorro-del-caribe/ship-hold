import { Pool } from 'pg';
import { select, insert, update, condition, delete, jsonAgg, toJson } from 'ship-hold-querybuilder';
import * as QueryStream from 'pg-query-stream';

const createPoolConnection = (conf) => {
    const pool = new Pool(conf);
    return {
        query(q) {
            return pool.query(q);
        },
        connect() {
            return pool.connect();
        },
        stop() {
            return pool.end();
        }
    };
};

const iterator = (gen) => (...args) => {
    const iter = gen(...args);
    iter.next();
    return iter;
};
const buildersFactory = (pool) => {
    const runner = {
        stream(consumer, params = {}, offset = 1) {
            const stream = this._stream(params);
            const iter = iterator(consumer)();
            stream.on('data', row => iter.next(row));
            stream.on('error', err => iter.throw(err));
            stream.on('end', () => iter.return());
        },
        _stream(params = {}, offset = 1) {
            const { text, values } = this.build(params, offset);
            const stream = new QueryStream(text, values);
            pool.connect().then(client => {
                const release = () => client.release();
                stream.on('end', release);
                stream.on('error', release);
                client.query(stream);
            });
            return stream;
        },
        debug(params = {}, offset = 1) {
            console.log(this.build(params, offset));
            return this.run(params, offset);
        },
        run(params = {}, offset = 1) {
            const rows = [];
            return new Promise((resolve, reject) => {
                // @ts-ignore
                this.stream(function* () {
                    try {
                        while (true) {
                            const r = yield;
                            rows.push(r);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                    finally {
                        resolve(rows);
                    }
                }, params, offset);
            });
        }
    };
    const delegateToBuilder = (builderFactory) => (...args) => Object.assign(builderFactory(...args), runner);
    return {
        select: delegateToBuilder(select),
        update: delegateToBuilder(update),
        delete: delegateToBuilder(delete),
        insert: delegateToBuilder(insert),
        if: (...args) => condition().if(...args)
    };
};

var RelationType;
(function (RelationType) {
    RelationType["BELONGS_TO"] = "BELONGS_TO";
    RelationType["HAS_ONE"] = "HAS_ONE";
    RelationType["HAS_MANY"] = "HAS_MANY";
    RelationType["BELONGS_TO_MANY"] = "BELONGS_TO_MANY";
})(RelationType || (RelationType = {}));
const buildRelation = (target, relationBuilder) => {
    const relDef = target.service.getRelationWith(relationBuilder.service);
    const reverse = relationBuilder.service.getRelationWith(target.service);
    if (relDef.type === "HAS_MANY" /* HAS_MANY */) {
        return oneToMany(target, relationBuilder);
    }
    if (relDef.type === "HAS_ONE" /* HAS_ONE */) {
        return hasOne(target, relationBuilder);
    }
    if (relDef.type === "BELONGS_TO" /* BELONGS_TO */ && reverse.type === "HAS_MANY" /* HAS_MANY */) {
        return manyToOne(target, relationBuilder);
    }
    if (relDef.type === "BELONGS_TO" /* BELONGS_TO */ && reverse.type === "HAS_ONE" /* HAS_ONE */) {
        return oneBelongsToOne(target, relationBuilder);
    }
    //todo many to many
    throw new Error('Unknown relation type');
};
const has = aggregateFunc => (targetBuilder, relationBuilder) => {
    const { alias } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { table: targetTable, primaryKey } = targetBuilder.service.definition;
    const { table: relationTable } = relationBuilder.service.definition;
    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;
    const leftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(primaryKey);
    const selectRightOperand = `"${targetTable}"."${primaryKey}"`;
    return targetBuilder
        .select({
        value: relSelect(aggregateFunc(`"${relationTable}".*`, alias))
            .where(leftOperand, selectRightOperand)
            .noop()
    })
        .with(relationTable, 
    // @ts-ignore
    relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};
const oneToMany = has(jsonAgg);
const manyToOne = (targetBuilder, relationBuilder) => {
    const { foreignKey, alias } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { table: targetTable } = targetBuilder.service.definition;
    const { primaryKey, table: relTable } = relationBuilder.service.definition;
    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;
    const withLeftOperand = `"${relTable}"."${primaryKey}"`;
    const withRightOperand = targetSelect(foreignKey);
    const selectRightOperand = `"${targetTable}"."${foreignKey}"`;
    return targetBuilder
        .select({
        value: relSelect(toJson(`"${relTable}".*`, alias)).where(withLeftOperand, selectRightOperand)
            .noop()
    })
        .with(relTable, 
    // @ts-ignore
    relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
};
const hasOne = has(toJson);
const oneBelongsToOne = (targetBuilder, relationBuilder) => {
    const { foreignKey, alias } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { table: targetTable } = targetBuilder.service.definition;
    const { table: relationTable, primaryKey } = relationBuilder.service.definition;
    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;
    const leftOperand = `"${relationTable}"."${primaryKey}"`;
    const rightOperand = `"${targetTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(foreignKey);
    return targetBuilder
        .select({
        value: relSelect(toJson(`"${relationTable}".*`, alias))
            .where(leftOperand, rightOperand)
            .noop()
    })
        .with(relationTable, 
    // @ts-ignore
    relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};

const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', { value: this });
    return builder;
};
const service = (definition, sh) => {
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

// Create a registry of services bound to a specific table
const serviceRegistry = (builders) => {
    const registry = new Map();
    const getService = (name) => {
        if (registry.has(name) === false) {
            throw new Error(`could not find the model ${name}`);
        }
        return registry.get(name);
    };
    const setService = function (def) {
        const definition = Object.assign({}, def);
        const { name } = definition;
        registry.set(name, service(definition, builders));
        return getService(name);
    };
    return {
        [Symbol.iterator]: () => registry.entries(),
        service(def) {
            return typeof def === 'string' ? getService(def) : setService(def);
        }
    };
};

const shiphold = (connect = {}) => {
    const connection = Object.assign({}, {
        host: 'localhost',
        port: 5432
    }, connect);
    const connector = createPoolConnection(connection);
    const builders = buildersFactory(connector);
    return Object.assign(serviceRegistry(builders), connector, builders);
};

export { shiphold };
