import {
    jsonAgg,
    SelectBuilder,
    toJson,
    coalesce,
    compositeNode,
    SQLComparisonOperator, Builder
} from 'ship-hold-querybuilder';
import {
    BelongsToManyRelationDefinition,
    BelongsToRelationDefinition, EntityBuilder,
    InclusionInput,
    RelationType,
    SelectServiceBuilder,
    ShipHoldBuilders, WithInclusion
} from '../interfaces';
import {setAsServiceBuilder} from './with-service-builder-mixin';
import {withInclude} from './with-include-builder-mixin';
import {service} from './service';

export const changeFromRelation = (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relation: InclusionInput) => {
    const {builder: relationBuilder} = relation;

    if (targetBuilder === relationBuilder) {
        return self(targetBuilder, sh);
    }

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

const movePaginationNode = (from: Builder, to: Builder) => {
    const orderBy = from.node('orderBy');
    const limit = from.node('limit');

    from.node('orderBy', compositeNode());
    from.node('limit', compositeNode());

    to.node('orderBy', orderBy);
    to.node('limit', limit);
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

    const value = sh.select()
        .from(as)
        .where(
            selectLeftOperand,
            selectRightOperand)
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
        .with(as,
            relationBuilder.where(withLeftOperand, SQLComparisonOperator.IN, withRightOperand).noop());
};

const createRelationBuilder = (pivotAlias: string, relationBuilder: SelectServiceBuilder) => {
    const {service} = relationBuilder;
    const builder = <SelectServiceBuilder>service.rawSelect().from(pivotAlias);

    // pass the inclusions along
    builder.include(...relationBuilder.inclusions);

    return builder;
};

const manyToMany = (targetBuilder: SelectServiceBuilder, relation: InclusionInput, sh: ShipHoldBuilders) => {
    const {builder: relationBuilder, as: alias} = relation;
    const {pivotKey: targetPivotKey, pivotTable} = <BelongsToManyRelationDefinition>targetBuilder.service.getRelationWith(relationBuilder.service);
    const {pivotKey: relationPivotKey} = <BelongsToManyRelationDefinition>relationBuilder.service.getRelationWith(targetBuilder.service);
    const {cte: targetName, primaryKey: targetPrimaryKey} = targetBuilder;
    const {primaryKey: relationPrimaryKey} = relationBuilder;

    const pivotAlias = ['_sh', targetName, alias, 'pivot'].join('_');
    const orderByNode = relationBuilder.node('orderBy');
    const value = sh
        .select()
        .from(alias)
        .where(`"${alias}"."${targetPivotKey}"`, `"${targetName}"."${targetPrimaryKey}"`)
        .noop();

    // re map orderBy nodes to alias
    for (const orderMember of [...orderByNode]) {
        // @ts-ignore
        const [prop, direction] = [...orderMember].map(({value}) => value);
        value.orderBy(`"${alias}"."${prop}"`, direction);
    }

    movePaginationNode(relationBuilder, value);

    const relationInJoin = relationBuilder.clone(false);

    const pivotWith = (<SelectBuilder>sh
        .select(`"${pivotTable}".*`, `"${alias}".*`, {value: `"${alias}"`, as: alias})
        .from(pivotTable))
        .join({value: relationInJoin, as: alias})
        .on(`"${pivotTable}"."${relationPivotKey}"`, `"${alias}"."${relationPrimaryKey}"`)
        .where(`"${pivotTable}"."${targetPivotKey}"`, SQLComparisonOperator.IN, sh.select(targetPrimaryKey).from(targetName))
        .noop();

    // we create a temporary service for the pivot
    const relationWith = createRelationBuilder(pivotAlias, relationBuilder);

    const relationBuilderInMainQuery = sh.select({
        value: coalesceAggregation(`"${alias}"`), as: alias
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

const self = (builder: SelectServiceBuilder, sh) => {
    const name = builder.service.definition.name;
    const setAsServiceB = setAsServiceBuilder(builder.service);

    const targetBuilder = setAsServiceB(sh.select(`"${name}".*`)
        .from(name)
        .with(name, builder), name);

    // We need to re apply pagination settings to ensure pagination works for complex queries etc.
    targetBuilder.node('orderBy', builder.node('orderBy'));

    return targetBuilder;
};
