import { jsonAgg, toJson } from 'ship-hold-querybuilder';
export var RelationType;
(function (RelationType) {
    RelationType["BELONGS_TO"] = "BELONGS_TO";
    RelationType["HAS_ONE"] = "HAS_ONE";
    RelationType["HAS_MANY"] = "HAS_MANY";
    RelationType["BELONGS_TO_MANY"] = "BELONGS_TO_MANY";
})(RelationType || (RelationType = {}));
export const buildRelation = (target, relationBuilder) => {
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
