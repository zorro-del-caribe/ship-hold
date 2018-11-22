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
const withQueryRunner = (pool) => {
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
    return (builder) => {
        return Object.assign(builder, runner);
    };
};

const buildersFactory = (pool) => {
    const runnable = withQueryRunner(pool);
    return {
        select: (...args) => runnable(select(...args)),
        update: (...args) => runnable(update(...args)),
        delete: (...args) => runnable(delete(...args)),
        insert: (...args) => runnable(insert(...args)),
        if: (...args) => condition().if(...args)
    };
};

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
const oneBelongsToOne = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { foreignKey } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { cte: targetName } = targetBuilder;
    const { primaryKey, cte: relationTable } = relationBuilder;
    const selectLeftOperand = `"${alias}"."${primaryKey}"`;
    const selectRightOperand = `"${targetName}"."${foreignKey}"`;
    const withLeftOperand = `"${relationTable}"."${primaryKey}"`;
    const withRightOperand = sh.select(foreignKey).from(targetName);
    const selectValue = {
        value: toJson(`"${alias}".*`),
        as: alias
    };
    return targetBuilder
        .select({
        value: sh.select(selectValue)
            .from(alias)
            .where(selectLeftOperand, selectRightOperand)
            .noop()
    })
        .with(alias, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const manyToOne = (targetBuilder, relation, sh) => {
    const { as: alias, builder: relationBuilder } = relation;
    const { foreignKey } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { cte: targetName } = targetBuilder;
    const { primaryKey, cte: relTable } = relationBuilder;
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
    const { cte: targetName, primaryKey } = targetBuilder;
    const { cte: relationTable } = relationBuilder;
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
        .with(alias, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);
const oneToMany = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as } = relation;
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { cte: targetCTE, primaryKey } = targetBuilder;
    const { cte: relationCTE } = relationBuilder;
    const selectLeftOperand = `"${as}"."${foreignKey}"`;
    const selectRightOperand = `"${targetCTE}"."${primaryKey}"`;
    const withLeftOperand = `"${relationCTE}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetCTE);
    let relationBuilderInMainQuery;
    const orderByNode = relationBuilder.node('orderBy');
    const limitNode = relationBuilder.node('limit');
    const createRelationBuilder = (selectArgument = '*') => sh.select(selectArgument)
        .from(as)
        .where(selectLeftOperand, selectRightOperand)
        .noop();
    // We need to paginate the subquery
    if (orderByNode.length || limitNode.length) {
        relationBuilder.node('orderBy', compositeNode());
        relationBuilder.node('limit', compositeNode());
        const value = createRelationBuilder();
        value.node('orderBy', orderByNode);
        value.node('limit', limitNode);
        relationBuilderInMainQuery = sh.select({
            value: coalesceAggregation(`"${as}".*`), as
        })
            .from({
            value: value,
            as
        });
    }
    else {
        relationBuilderInMainQuery = createRelationBuilder({ value: coalesceAggregation(`"${as}".*`), as });
    }
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(as, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const shFn = 'sh_temp';
//todo investigate how nested pagination on nested include would work here would work here
const manyToMany = (targetBuilder, relation, sh) => {
    const { builder: relationBuilder, as: alias } = relation;
    const { pivotKey: targetPivotKey, pivotTable } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { pivotKey: relationPivotKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { cte: targetName, primaryKey: targetPrimaryKey } = targetBuilder;
    const { primaryKey: relationPrimaryKey } = relationBuilder;
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
    const createRelationBuilder = (selectArgument = '*') => sh
        .select(selectArgument)
        .from(alias)
        .where(`"${alias}"."${targetPivotKey}"`, `"${targetName}"."${targetPrimaryKey}"`)
        .noop();
    if (orderByNode.length || limitNode.length) {
        relationBuilder.node('orderBy', compositeNode());
        relationBuilder.node('limit', compositeNode());
        const value = createRelationBuilder();
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
        relationBuilderInMainQuery = createRelationBuilder({
            value: coalesceAggregation(`${shFn}(${alias})`),
            as: alias
        });
    }
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(alias, pivotWith);
};

const withRelation = (serviceToRelation, aliasToService) => {
    return {
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
    };
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
const setAsServiceBuilder = (service) => {
    const { table, primaryKey } = service.definition;
    return (builder, tableName = table) => Object.defineProperties(builder, {
        service: { value: service },
        cte: { value: tableName },
        primaryKey: { value: primaryKey }
    });
};

const service = (definition, sh) => {
    const { table, name } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    let setAsServiceB;
    const withInclude = (builder) => Object.assign(builder, {
        include(...relations) {
            // todo we may need to (unset) pagination on "builder" in case we are in a nested include (ie if we have a parent)
            // todo therefore we also need to restrict the with query (for efficiency) depending on the relation with the parent
            const orderBy = builder.node('orderBy');
            const limit = builder.node('limit');
            builder.node('orderBy', compositeNode());
            builder.node('limit', compositeNode());
            const targetBuilder = setAsServiceB(sh.select(`"${name}".*`)
                .from(name)
                .with(name, builder), name);
            const newBuilder = relations
                .map(normaliseInclude(aliasToService, builder))
                .reduce(buildRelation(sh), targetBuilder);
            // We need to re apply pagination settings to ensure pagination work for complex queries etc.
            newBuilder.node('orderBy', orderBy);
            newBuilder.node('limit', limit);
            console.log(newBuilder.build());
            return newBuilder;
        }
    });
    const ServicePrototype = Object.assign({
        select: (...args) => setAsServiceB(withInclude(sh
            .select(...args)
            .from(table))),
        insert: (...args) => setAsServiceB(sh
            .insert(...args)
            .into(table)
            .returning('*')),
        update: (map = {}) => {
            const builder = sh
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
        definition: { value: Object.freeze(definition) } // Todo should freeze deeply
    });
    setAsServiceB = setAsServiceBuilder(serviceInstance);
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
