import {SelectServiceBuilder} from './service';
import {jsonAgg, SelectBuilder, SQLComparisonOperator, toJson, Buildable, coalesce} from 'ship-hold-querybuilder';
import {ShipHoldBuilders} from './builders';

export const enum RelationType {
    BELONGS_TO = 'BELONGS_TO',
    HAS_ONE = 'HAS_ONE',
    HAS_MANY = 'HAS_MANY',
    BELONGS_TO_MANY = 'BELONGS_TO_MANY'
}

export interface RelationDefinition {
    type: RelationType;
    alias: string;
}

export interface BelongsToRelationDefinition extends RelationDefinition {
    foreignKey: string;
}

export interface BelongsToManyRelationDefinition extends RelationDefinition {
    pivotTable: string;
    pivotKey: string;
}

export interface InclusionParameter {
    builder: Buildable;
    as: string
}

export const buildRelation = (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const relDef = targetBuilder.service.getRelationWith(relationBuilder.service);
    const reverse = relationBuilder.service.getRelationWith(targetBuilder.service);

    let relFunc;

    switch (relDef.type) {
        case RelationType.HAS_MANY: {
            relFunc = oneToMany;
            break;
        }
        case RelationType.HAS_ONE: {
            relFunc = hasOne;
            break;
        }
        case RelationType.BELONGS_TO_MANY: {
            relFunc = manyToMany;
            break;
        }
        case RelationType.BELONGS_TO: {
            relFunc = reverse.type === RelationType.HAS_MANY ? manyToOne : oneBelongsToOne;
            break;
        }
    }

    if (!relFunc) {
        throw new Error('Unknown relation type');
    }

    return relFunc(targetBuilder, relationBuilder, sh);
};

const has = aggregateFunc => (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {alias} = targetBuilder.service.getRelationWith(relationBuilder.service);
    const {foreignKey} = <BelongsToRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {table: targetTable, primaryKey} = targetBuilder.service.definition;
    const {table: relationTable} = relationBuilder.service.definition;

    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;

    const leftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(primaryKey);
    const selectRightOperand = `"${targetTable}"."${primaryKey}"`;
    return targetBuilder
        .select({
            value: relSelect({value: aggregateFunc(`"${relationTable}".*`), as: alias})
                .where(
                    leftOperand,
                    selectRightOperand)
                .noop()
        })
        .with(relationTable,
            relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};

const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);

const oneToMany = has(coalesceAggregation);

const manyToOne = (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {foreignKey, alias} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {table: targetTable} = targetBuilder.service.definition;
    const {primaryKey, table: relTable} = relationBuilder.service.definition;

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
        .with(relTable,
            relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
};

const hasOne = has(toJson);

const oneBelongsToOne = (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {foreignKey, alias} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {table: targetTable} = targetBuilder.service.definition;
    const {table: relationTable, primaryKey} = relationBuilder.service.definition;

    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;

    const leftOperand = `"${relationTable}"."${primaryKey}"`;
    const rightOperand = `"${targetTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(foreignKey);

    return targetBuilder
        .select({
            value: relSelect({value: toJson(`"${relationTable}".*`), as: alias})
                .where(
                    leftOperand,
                    rightOperand)
                .noop()
        })
        .with(relationTable,
            relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};

const shFn = 'sh_fn';
const manyToMany = (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder, sh: ShipHoldBuilders) => {
    const {pivotKey: targetPivotKey, alias, pivotTable} = <BelongsToManyRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {pivotKey: relationPivotKey} = <BelongsToManyRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {table: targetTable, primaryKey: targetPrimaryKey} = targetBuilder.service.definition;
    const {table: relationTable, primaryKey: relationPrimaryKey} = relationBuilder.service.definition;

    const pivotWith = (<SelectBuilder>sh
        .select(`"${pivotTable}"."${targetPivotKey}"`, {value: `"${relationTable}"`, as: shFn})
        .from(pivotTable))
        .join({value: relationBuilder, as: relationTable})
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${relationTable}"."${relationPrimaryKey}"`)
        .where(`"${pivotTable}"."${targetPivotKey}"`, 'IN', sh.select(targetPrimaryKey).from(targetTable)) // todo check with other relation should be corrected in case we pass other aliases
        .noop();


    return targetBuilder
        .select({
            value: sh
                .select({value: coalesce([jsonAgg(`${shFn}(${relationTable})`), `'[]'::json`]), as: alias}) //todo same than above (should use alias of with instead)
                .from(relationTable)
                .where(`"${relationTable}"."${targetPivotKey}"`, `"${targetTable}"."${targetPrimaryKey}"`)
                .noop()
        })
        .with(relationTable, pivotWith);
};
