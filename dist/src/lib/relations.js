import { jsonAgg, toJson, coalesce, compositeNode } from 'ship-hold-querybuilder';
import { setAsServiceBuilder } from './with-service-builder-mixin';
export const morphBuilder = (sh) => (targetBuilder, relation) => {
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
