import {SelectServiceBuilder} from './service';
import {
    jsonAgg,
    SelectBuilder,
    toJson,
    coalesce,
    compositeNode, Builder, SQLComparisonOperator
} from 'ship-hold-querybuilder';
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

export interface InclusionInput {
    builder: SelectServiceBuilder;
    as: string
}

export const buildRelation = (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relation: InclusionInput) => {
    const {builder: relationBuilder} = relation;
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

    return relFunc(targetBuilder, relation, sh);
};

//todo alias
const oneBelongsToOne = (targetBuilder: SelectServiceBuilder, relation: InclusionInput) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {table: targetTable} = targetBuilder.service.definition;
    const {table: relationTable, primaryKey} = relationBuilder.service.definition;

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
                .where(
                    leftOperand,
                    rightOperand)
                .noop()
        })
        .with(relationTable,
            relationBuilder.where(leftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const manyToOne = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {as: alias, builder: relationBuilder} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {name: targetName} = targetBuilder.service.definition;
    const {primaryKey, table: relTable} = relationBuilder.service.definition;

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
        .with(alias,
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const hasOne = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {name: targetName, primaryKey} = targetBuilder.service.definition;
    const {table: relationTable} = relationBuilder.service.definition;

    const withLeftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetName);
    const selectLeftOperand = `"${alias}"."${foreignKey}"`;
    const selectRightOperand = `"${targetName}"."${primaryKey}"`;

    return targetBuilder
        .select({
            value: sh.select({value: toJson(`"${alias}".*`), as: alias})
                .from(alias)
                .where(
                    selectLeftOperand,
                    selectRightOperand)
                .noop()
        })
        .with(alias,
            relationBuilder.where(withLeftOperand, 'IN', withRightOperand).noop());
};

const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);
const oneToMany = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {name: targetName, primaryKey} = targetBuilder.service.definition;
    const {table: relationTable} = relationBuilder.service.definition;

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
            .where(
                selectLeftOperand,
                selectRightOperand)
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
    } else {
        relationBuilderInMainQuery = sh.select({value: coalesceAggregation(`"${alias}".*`), as: alias})
            .from(alias)
            .where(
                selectLeftOperand,
                selectRightOperand)
            .noop();
    }

    return targetBuilder
        .select({
            value: relationBuilderInMainQuery
        })
        .with(alias,
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const shFn = 'sh_temp';
const manyToMany = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {pivotKey: targetPivotKey, pivotTable} = <BelongsToManyRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {pivotKey: relationPivotKey} = <BelongsToManyRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {name: targetName, primaryKey: targetPrimaryKey} = targetBuilder.service.definition;
    const {primaryKey: relationPrimaryKey} = relationBuilder.service.definition;

    const pivotWith = (<SelectBuilder>sh
        .select(`"${pivotTable}"."${targetPivotKey}"`, {value: `"${alias}"`, as: shFn})
        .from(pivotTable))
        .join({value: relationBuilder, as: alias})
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${alias}"."${relationPrimaryKey}"`)
        .where(`"${pivotTable}"."${targetPivotKey}"`, SQLComparisonOperator.IN, sh.select(targetPrimaryKey).from(targetName))
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
            const [prop, direction] = [...orderMember].map(({value}) => value);
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

    } else {
        relationBuilderInMainQuery = sh
            .select({value: coalesceAggregation(`${shFn}(${alias})`), as: alias})
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
