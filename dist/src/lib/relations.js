import { jsonAgg, toJson, coalesce, compositeNode } from 'ship-hold-querybuilder';
export var RelationType;
(function (RelationType) {
    RelationType["BELONGS_TO"] = "BELONGS_TO";
    RelationType["HAS_ONE"] = "HAS_ONE";
    RelationType["HAS_MANY"] = "HAS_MANY";
    RelationType["BELONGS_TO_MANY"] = "BELONGS_TO_MANY";
})(RelationType || (RelationType = {}));
export const buildRelation = (sh) => (targetBuilder, relation) => {
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
