import { Pool } from 'pg';
import * as QueryStream from 'pg-query-stream';
import { select, insert, update, condition, delete, jsonAgg, toJson, coalesce, compositeNode } from 'ship-hold-querybuilder';

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
const buildRelation = (sh) => (targetBuilder, relation) => {
    const { builder: relationBuilder } = relation;
    const relDef = targetBuilder.service.getRelationWith(relationBuilder.service);
    const reverse = relationBuilder.service.getRelationWith(targetBuilder.service);
    let relFunc;
    switch (relDef.type) {
        case "HAS_MANY" /* HAS_MANY */: {
            relFunc = oneToMany;
            break;
        }
        case "HAS_ONE" /* HAS_ONE */: {
            relFunc = hasOne;
            break;
        }
        case "BELONGS_TO_MANY" /* BELONGS_TO_MANY */: {
            relFunc = manyToMany;
            break;
        }
        case "BELONGS_TO" /* BELONGS_TO */: {
            relFunc = reverse.type === "HAS_MANY" /* HAS_MANY */ ? manyToOne : oneBelongsToOne;
            break;
        }
    }
    if (!relFunc) {
        throw new Error('Unknown relation type');
    }
    return relFunc(targetBuilder, relation, sh);
};
//todo alias
const oneBelongsToOne = (targetBuilder, relation) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { foreignKey } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { table: targetTable } = targetBuilder.service.definition;
    const { table: relationTable, primaryKey } = relationBuilder.service.definition;
    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;
    const leftOperand = `"${relationTable}"."${primaryKey}"`;
    const rightOperand = `"${targetTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(foreignKey);
    return targetBuilder
        .select({
        value: relSelect({
            value: toJson(`"${relationTable}".*`),
            as: alias
        })
            .where(leftOperand, rightOperand)
            .noop()
    })
        .with(relationTable, relationBuilder.where(leftOperand, "IN" /* IN */, withRightOperand).noop());
};
const manyToOne = (targetBuilder, relation, sh) => {
    const { as: alias, builder: relationBuilder } = relation;
    const { foreignKey } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { name: targetName } = targetBuilder.service.definition;
    const { primaryKey, table: relTable } = relationBuilder.service.definition;
    const selectLeftOperand = `"${alias}"."${primaryKey}"`;
    const selectRightOperand = `"${targetName}"."${foreignKey}"`;
    const withLeftOperand = `"${relTable}"."${primaryKey}"`;
    const withRightOperand = sh.select(foreignKey).from(targetName);
    return targetBuilder
        .select({
        value: sh.select({
            value: toJson(`"${alias}".*`),
            as: alias
        })
            .from(alias)
            .where(selectLeftOperand, selectRightOperand)
            .noop()
    })
        .with(alias, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const hasOne = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { name: targetName, primaryKey } = targetBuilder.service.definition;
    const { table: relationTable } = relationBuilder.service.definition;
    const withLeftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetName);
    const selectLeftOperand = `"${alias}"."${foreignKey}"`;
    const selectRightOperand = `"${targetName}"."${primaryKey}"`;
    return targetBuilder
        .select({
        value: sh.select({ value: toJson(`"${alias}".*`), as: alias })
            .from(alias)
            .where(selectLeftOperand, selectRightOperand)
            .noop()
    })
        .with(alias, relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
};
const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);
const oneToMany = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { name: targetName, primaryKey } = targetBuilder.service.definition;
    const { table: relationTable } = relationBuilder.service.definition;
    const selectLeftOperand = `"${alias}"."${foreignKey}"`;
    const selectRightOperand = `"${targetName}"."${primaryKey}"`;
    const withLeftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetName);
    let relationBuilderInMainQuery;
    const orderByNode = relationBuilder.node('orderBy');
    const limitNode = relationBuilder.node('limit');
    // We need to paginate the subquery
    if (orderByNode.length || limitNode.length) {
        relationBuilder.node('orderBy', compositeNode());
        relationBuilder.node('limit', compositeNode());
        const value = sh.select()
            .from(alias)
            .where(selectLeftOperand, selectRightOperand)
            .noop();
        value.node('orderBy', orderByNode);
        value.node('limit', limitNode);
        relationBuilderInMainQuery = sh.select({
            value: coalesceAggregation(`"${alias}".*`), as: alias
        })
            .from({
            value: value,
            as: alias
        });
    }
    else {
        relationBuilderInMainQuery = sh.select({ value: coalesceAggregation(`"${alias}".*`), as: alias })
            .from(alias)
            .where(selectLeftOperand, selectRightOperand)
            .noop();
    }
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(alias, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const shFn = 'sh_temp';
const manyToMany = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { pivotKey: targetPivotKey, pivotTable } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { pivotKey: relationPivotKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { name: targetName, primaryKey: targetPrimaryKey } = targetBuilder.service.definition;
    const { primaryKey: relationPrimaryKey } = relationBuilder.service.definition;
    const pivotWith = sh
        .select(`"${pivotTable}"."${targetPivotKey}"`, { value: `"${alias}"`, as: shFn })
        .from(pivotTable)
        .join({ value: relationBuilder, as: alias })
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${alias}"."${relationPrimaryKey}"`)
        .where(`"${pivotTable}"."${targetPivotKey}"`, "IN" /* IN */, sh.select(targetPrimaryKey).from(targetName))
        .noop();
    let relationBuilderInMainQuery;
    const orderByNode = relationBuilder.node('orderBy');
    const limitNode = relationBuilder.node('limit');
    if (orderByNode.length || limitNode.length) {
        relationBuilder.node('orderBy', compositeNode());
        relationBuilder.node('limit', compositeNode());
        const value = sh
            .select()
            .from(alias)
            .where(`"${alias}"."${targetPivotKey}"`, `"${targetName}"."${targetPrimaryKey}"`)
            .noop();
        for (const orderMember of [...orderByNode]) {
            // @ts-ignore
            const [prop, direction] = [...orderMember].map(({ value }) => value);
            value.orderBy(`("${alias}"."${shFn}").${prop}`, direction);
        }
        value.node('limit', limitNode);
        relationBuilderInMainQuery = sh.select({
            value: coalesceAggregation(`${shFn}(${alias})`), as: alias
        })
            .from({
            value: value,
            as: alias
        });
    }
    else {
        relationBuilderInMainQuery = sh
            .select({ value: coalesceAggregation(`${shFn}(${alias})`), as: alias })
            .from(alias)
            .where(`"${alias}"."${targetPivotKey}"`, `"${targetName}"."${targetPrimaryKey}"`)
            .noop();
    }
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(alias, pivotWith);
};

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
const service = (definition, sh) => {
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
