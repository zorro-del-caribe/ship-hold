import { jsonAgg, toJson, coalesce } from 'ship-hold-querybuilder';
export var RelationType;
(function (RelationType) {
    RelationType["BELONGS_TO"] = "BELONGS_TO";
    RelationType["HAS_ONE"] = "HAS_ONE";
    RelationType["HAS_MANY"] = "HAS_MANY";
    RelationType["BELONGS_TO_MANY"] = "BELONGS_TO_MANY";
})(RelationType || (RelationType = {}));
export const buildRelation = (sh) => (targetBuilder, relationBuilder) => {
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
const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);
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
            value: toJson(`"${relTable}".*`),
            as: alias
        }).where(withLeftOperand, selectRightOperand)
            .noop()
    })
        .with(relTable, relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
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
        value: relSelect({ value: toJson(`"${relationTable}".*`), as: alias })
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
            .select({ value: coalesce([jsonAgg(`${shFn}(${relationTable})`), `'[]'::json`]), as: alias }) //todo same than above (should use alias of with instead)
            .from(relationTable)
            .where(`"${relationTable}"."${targetPivotKey}"`, `"${targetTable}"."${targetPrimaryKey}"`)
            .noop()
    })
        .with(relationTable, pivotWith);
};
