import { Pool } from 'pg';
import { select, update, delete as delete$1, insert, condition, toJson, coalesce, jsonAgg, compositeNode } from 'ship-hold-querybuilder';
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
/**
 * Create a functional mixin to be applied to a builder to be able to run the query against an actual database connection
 * Note: the mixin is "stateless" (or at least the connection pool can and should be shared across builders) and therefore can be copied as is when cloning a builder
 * @param {DBConnectionsPool} pool
 * @returns {WithQueryRunnerMixin}
 */
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
        delete: (...args) => runnable(delete$1(...args)),
        insert: (...args) => runnable(insert(...args)),
        if: (...args) => condition().if(...args)
    };
};

/**
 * Mixin to be applied to an Entity Service to support associations
 * @param {WeakMap<EntityService, RelationDefinition>} serviceToRelation
 * @param {Map<string, EntityService>} aliasToService
 * @returns {WithRelations<EntityService>}
 */
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
        return { value: service.select(), as: rel };
    }
    const builder = ('build' in rel ? rel : rel.select()).noop();
    const as = targetBuilder.service.getRelationWith(builder.service).alias;
    return {
        value: builder,
        as
    };
};
const uppercaseTheFirstLetter = (word) => {
    const [first, ...rest] = word;
    return [first.toUpperCase(), ...rest].join('');
};
const toCamelCase = (input) => {
    return input
        .split('_')
        .map(uppercaseTheFirstLetter)
        .join();
};

/**
 * Create a functional mixin to be applied to a builder to pass metadata related to the service and context the builder was generated with
 * Note: the metadata are part of the "identity" of the builder and therefore are copied when cloning a builder
 * @param {EntityService} service
 * @returns {WithServiceBuilderMixin}
 */
const setAsServiceBuilder = (service) => {
    const { table, primaryKey } = service.definition;
    return (builder, tableName = table) => Object.defineProperties(builder, {
        service: { value: service, enumerable: true },
        cte: { value: tableName, enumerable: true, writable: true },
        primaryKey: { value: primaryKey, enumerable: true }
    });
};

const morphBuilder = (sh) => (targetBuilder, relation) => {
    const { value: relationBuilder } = relation;
    if (targetBuilder === relationBuilder) {
        return self(targetBuilder, sh);
    }
    const relDef = targetBuilder.service.getRelationWith(relationBuilder.service);
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
            relFunc = belongsTo;
            break;
        }
    }
    if (!relFunc) {
        throw new Error('Unknown relation type');
    }
    return relFunc(targetBuilder, relation, sh);
};
const belongsTo = (targetBuilder, relation, sh) => {
    const { value: relationBuilder, as } = relation;
    const { foreignKey } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { cte: targetName } = targetBuilder;
    const { primaryKey, cte: relationTable } = relationBuilder;
    const selectLeftOperand = `"${as}"."${primaryKey}"`;
    const selectRightOperand = `"${targetName}"."${foreignKey}"`;
    const withLeftOperand = `"${relationTable}"."${primaryKey}"`;
    const withRightOperand = sh.select(foreignKey).from(targetName);
    const selectValue = {
        value: toJson(`"${as}".*`),
        as
    };
    return targetBuilder
        .select({
        value: sh.select(selectValue)
            .from(as)
            .where(selectLeftOperand, selectRightOperand)
            .noop(),
        as
    })
        .with(as, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const hasOne = (targetBuilder, relation, sh) => {
    const { value: relationBuilder, as } = relation;
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { cte: targetName, primaryKey } = targetBuilder;
    const { cte: relationName } = relationBuilder;
    const selectLeftOperand = `"${as}"."${foreignKey}"`;
    const selectRightOperand = `"${targetName}"."${primaryKey}"`;
    const withLeftOperand = `"${relationName}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetName);
    return targetBuilder
        .select({
        value: sh.select({ value: toJson(`"${as}".*`), as: as })
            .from(as)
            .where(selectLeftOperand, selectRightOperand)
            .noop()
    })
        .with(as, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const movePaginationNode = (from, to) => {
    const orderBy = from.node('orderBy');
    const limit = from.node('limit');
    from.node('orderBy', compositeNode());
    from.node('limit', compositeNode());
    to.node('orderBy', orderBy);
    to.node('limit', limit);
};
const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]); // we return empty array instead of null
const oneToMany = (targetBuilder, relation, sh) => {
    const { value: relationBuilder, as } = relation;
    const { foreignKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { cte: targetName, primaryKey } = targetBuilder;
    const { cte: relationName } = relationBuilder;
    const selectLeftOperand = `"${as}"."${foreignKey}"`;
    const selectRightOperand = `"${targetName}"."${primaryKey}"`;
    const withLeftOperand = `"${relationName}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetName);
    const value = sh.select()
        .from(as)
        .where(selectLeftOperand, selectRightOperand)
        .noop();
    // We need to paginate the subquery
    movePaginationNode(relationBuilder, value);
    const relationBuilderInMainQuery = sh.select({
        value: coalesceAggregation(`"${as}".*`), as
    })
        .from({
        value,
        as
    });
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(as, relationBuilder.where(withLeftOperand, "IN" /* IN */, withRightOperand).noop());
};
const createRelationBuilder = (pivotAlias, alias, targetPivotKey, relationBuilder) => {
    const { service } = relationBuilder;
    const builder = service.rawSelect(`("${pivotAlias}"."${alias}").*`, `"${pivotAlias}"."${targetPivotKey}"`).from(pivotAlias);
    // pass the inclusions along
    builder.include(...relationBuilder.inclusions);
    return builder;
};
const aggregateAndClean = (arg, toRemove) => coalesce([jsonAgg(`to_jsonb(${arg}) - '${toRemove}'`), `'[]'::json`]);
const manyToMany = (targetBuilder, relation, sh) => {
    const { value: relationBuilder, as: alias } = relation;
    const { pivotKey: targetPivotKey, pivotTable } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { pivotKey: relationPivotKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { cte: targetName, primaryKey: targetPrimaryKey } = targetBuilder;
    const { primaryKey: relationPrimaryKey } = relationBuilder;
    const pivotAlias = ['_sh', targetName, alias, 'pivot'].join('_');
    const orderByNode = relationBuilder.node('orderBy');
    const value = sh
        .select(`"${alias}"`)
        .from(alias)
        .where(`"${alias}"."${targetPivotKey}"`, `"${targetName}"."${targetPrimaryKey}"`)
        .noop();
    // re map orderBy nodes to alias
    for (const orderMember of [...orderByNode]) {
        // @ts-ignore
        const [prop, direction] = [...orderMember].map(({ value }) => value);
        value.orderBy(`"${alias}"."${prop}"`, direction);
    }
    movePaginationNode(relationBuilder, value);
    const relationInJoin = relationBuilder.clone(false);
    const pivotWith = sh
        .select(`"${pivotTable}"."${targetPivotKey}"`, `"${pivotTable}"."${relationPivotKey}"`, {
        value: `"${alias}"`,
        as: alias
    })
        .from(pivotTable)
        .where(`"${pivotTable}"."${targetPivotKey}"`, "IN" /* IN */, sh.select(targetPrimaryKey).from(targetName))
        .join({ value: relationInJoin, as: alias })
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${alias}"."${relationPrimaryKey}"`)
        .noop();
    // we create a temporary service for the pivot
    const relationWith = createRelationBuilder(pivotAlias, alias, targetPivotKey, relationBuilder);
    const relationBuilderInMainQuery = sh.select({
        value: aggregateAndClean(`"${alias}"`, targetPivotKey), as: alias
    })
        .from({
        value: value,
        as: alias
    });
    return targetBuilder
        .select({
        value: relationBuilderInMainQuery
    })
        .with(pivotAlias, pivotWith)
        .with(alias, relationWith);
};
const self = (builder, sh) => {
    const name = builder.service.definition.name;
    const setAsServiceB = setAsServiceBuilder(builder.service);
    const targetBuilder = setAsServiceB(sh.select(`"${name}".*`)
        .from(name)
        .with(name, builder), name);
    // We need to re apply pagination settings to ensure pagination works for complex queries etc.
    targetBuilder.node('orderBy', builder.node('orderBy'));
    return targetBuilder;
};

const withInclude = (aliasToService, sh) => {
    return (target) => {
        const include = withInclude(aliasToService, sh);
        const originalBuild = Object.getPrototypeOf(target).build.bind(target);
        const originalClone = Object.getPrototypeOf(target).clone.bind(target);
        return Object.assign(target, {
            inclusions: [],
            include(...relations) {
                this.inclusions.push(...relations
                    .map(normaliseInclude(aliasToService, target)));
                return this;
            },
            clone(deep = true) {
                const clone = include(originalClone());
                if (deep === true && this.inclusions.length) {
                    clone.include(...this.inclusions.map(({ as, value }) => {
                        const relationClone = value.clone();
                        return {
                            as,
                            value: relationClone
                        };
                    }));
                }
                return clone;
            },
            toBuilder() {
                const clone = this.clone();
                const fullRelationsList = [{
                        as: target.cte,
                        value: clone
                    }, ...clone.inclusions];
                clone.inclusions.splice(0); // empty list
                return include(fullRelationsList.reduce(morphBuilder(sh), clone));
            },
            build(params, offset) {
                if (this.inclusions.length === 0) {
                    return originalBuild(params, offset);
                }
                return this.toBuilder().build(params, offset);
            }
        });
    };
};

const service = (definition, sh) => {
    const { table } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    const include = withInclude(aliasToService, sh);
    let setAsServiceB;
    const ServicePrototype = Object.assign({
        rawSelect: (...args) => {
            return setAsServiceB(include(sh
                .select(...args)));
        },
        select: (...args) => {
            return setAsServiceB(include(sh
                .select(...args)
                .from(table)));
        },
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
        definition: { value: Object.freeze(definition) }
    });
    setAsServiceB = setAsServiceBuilder(serviceInstance);
    return serviceInstance;
};

// Create a registry of services bound to a specific table
const serviceRegistry = (builders) => {
    const registry = new Map();
    const getService = (name) => {
        if (registry.has(name) === false) {
            throw new Error(`could not find the service ${name}`);
        }
        return registry.get(name);
    };
    const setService = function (def) {
        const definition = Object.assign({ primaryKey: 'id', name: toCamelCase(def.table) }, def);
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
