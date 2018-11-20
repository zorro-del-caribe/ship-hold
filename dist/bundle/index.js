'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pg = require('pg');
var QueryStream = require('pg-query-stream');
var shipHoldQuerybuilder = require('ship-hold-querybuilder');

const createPoolConnection = (conf) => {
    const pool = new pg.Pool(conf);
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
        select: delegateToBuilder(shipHoldQuerybuilder.select),
        update: delegateToBuilder(shipHoldQuerybuilder.update),
        delete: delegateToBuilder(shipHoldQuerybuilder.delete),
        insert: delegateToBuilder(shipHoldQuerybuilder.insert),
        if: (...args) => shipHoldQuerybuilder.condition().if(...args)
    };
};

var RelationType;
(function (RelationType) {
    RelationType["BELONGS_TO"] = "BELONGS_TO";
    RelationType["HAS_ONE"] = "HAS_ONE";
    RelationType["HAS_MANY"] = "HAS_MANY";
    RelationType["BELONGS_TO_MANY"] = "BELONGS_TO_MANY";
})(RelationType || (RelationType = {}));
const buildRelation = (sh) => (targetBuilder, relationBuilder) => {
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
    return relFunc(targetBuilder, relationBuilder, sh);
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
        value: relSelect({ value: aggregateFunc(`"${relationTable}".*`), as: alias })
            .where(leftOperand, selectRightOperand)
            .noop()
    })
        .with(relationTable, relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};
const coalesceAggregation = (arg) => shipHoldQuerybuilder.coalesce([shipHoldQuerybuilder.jsonAgg(arg), `'[]'::json`]);
const oneToMany = has(coalesceAggregation);
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
        value: relSelect({
            value: shipHoldQuerybuilder.toJson(`"${relTable}".*`),
            as: alias
        }).where(withLeftOperand, selectRightOperand)
            .noop()
    })
        .with(relTable, relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
};
const hasOne = has(shipHoldQuerybuilder.toJson);
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
        value: relSelect({ value: shipHoldQuerybuilder.toJson(`"${relationTable}".*`), as: alias })
            .where(leftOperand, rightOperand)
            .noop()
    })
        .with(relationTable, relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};
const shFn = 'sh_fn';
const manyToMany = (targetBuilder, relationBuilder, sh) => {
    const { pivotKey: targetPivotKey, alias, pivotTable } = targetBuilder.service.getRelationWith(relationBuilder.service);
    const { pivotKey: relationPivotKey } = relationBuilder.service.getRelationWith(targetBuilder.service);
    const { table: targetTable, primaryKey: targetPrimaryKey } = targetBuilder.service.definition;
    const { table: relationTable, primaryKey: relationPrimaryKey } = relationBuilder.service.definition;
    const pivotWith = sh
        .select(`"${pivotTable}"."${targetPivotKey}"`, { value: `"${relationTable}"`, as: shFn })
        .from(pivotTable)
        .join({ value: relationBuilder, as: relationTable })
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${relationTable}"."${relationPrimaryKey}"`)
        .where(`"${pivotTable}"."${targetPivotKey}"`, 'IN', sh.select(targetPrimaryKey).from(targetTable)) // todo check with other relation should be corrected in case we pass other aliases
        .noop();
    return targetBuilder
        .select({
        value: sh
            .select({ value: shipHoldQuerybuilder.coalesce([shipHoldQuerybuilder.jsonAgg(`${shFn}(${relationTable})`), `'[]'::json`]), as: alias }) //todo same than above (should use alias of with instead)
            .from(relationTable)
            .where(`"${relationTable}"."${targetPivotKey}"`, `"${targetTable}"."${targetPrimaryKey}"`)
            .noop()
    })
        .with(relationTable, pivotWith);
};

const withService = fn => function (...args) {
    const builder = fn(...args);
    Object.defineProperty(builder, 'service', { value: this });
    return builder;
};
// todo typecast
const normalise = (aliasToService) => (rel) => {
    // Alias
    if (typeof rel === 'string') {
        const service = aliasToService.get(rel);
        return service.select();
    }
    // Builder
    if ('build' in rel) {
        return rel;
    }
    // Service
    return rel.select();
};
const service = (definition, sh) => {
    const { table } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    const withInclude = (builder) => Object.assign(builder, {
        include(...relations) {
            const newBuilder = relations
                .map(normalise(aliasToService))
                .map(r => r.noop())
                .reduce(buildRelation(sh), serviceInstance.select(`"${table}".*`)
                .with(table, builder));
            // We need to re apply sort to ensure pagination for complex queries etc.
            // @ts-ignore
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

exports.shiphold = shiphold;
