import {
    jsonAgg,
    SelectBuilder,
    toJson,
    coalesce,
    compositeNode,
    SQLComparisonOperator
} from 'ship-hold-querybuilder';
import {
    BelongsToManyRelationDefinition,
    BelongsToRelationDefinition,
    InclusionInput,
    RelationType,
    SelectServiceBuilder,
    ShipHoldBuilders
} from '../interfaces';

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

const oneBelongsToOne = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {cte: targetName} = targetBuilder;
    const {primaryKey, cte: relationTable} = relationBuilder;

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
        .with(alias,
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const manyToOne = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {as: alias, builder: relationBuilder} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {cte: targetName} = targetBuilder;
    const {primaryKey, cte: relTable} = relationBuilder;

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
    const {cte: targetName, primaryKey} = targetBuilder;
    const {cte: relationTable} = relationBuilder;

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
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const coalesceAggregation = (arg) => coalesce([jsonAgg(arg), `'[]'::json`]);
const oneToMany = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh) => {
    const {builder: relationBuilder, as} = relation;
    const {foreignKey} = <BelongsToRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {cte: targetCTE, primaryKey} = targetBuilder;
    const {cte: relationCTE} = relationBuilder;

    const selectLeftOperand = `"${as}"."${foreignKey}"`;
    const selectRightOperand = `"${targetCTE}"."${primaryKey}"`;
    const withLeftOperand = `"${relationCTE}"."${foreignKey}"`;
    const withRightOperand = sh.select(primaryKey).from(targetCTE);

    let relationBuilderInMainQuery;
    const orderByNode = relationBuilder.node('orderBy');
    const limitNode = relationBuilder.node('limit');

    const createRelationBuilder = (selectArgument: any = '*') => sh.select(selectArgument)
        .from(as)
        .where(
            selectLeftOperand,
            selectRightOperand)
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
    } else {
        relationBuilderInMainQuery = createRelationBuilder({value: coalesceAggregation(`"${as}".*`), as});
    }

    return targetBuilder
        .select({
            value: relationBuilderInMainQuery
        })
        .with(as,
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const shFn = 'sh_temp';

//todo investigate how nested pagination on nested include would work here would work here
const manyToMany = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {pivotKey: targetPivotKey, pivotTable} = <BelongsToManyRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {pivotKey: relationPivotKey} = <BelongsToManyRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {cte: targetName, primaryKey: targetPrimaryKey} = targetBuilder;
    const {primaryKey: relationPrimaryKey} = relationBuilder;

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

    const createRelationBuilder = (selectArgument: any = '*') => sh
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
