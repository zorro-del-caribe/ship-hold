import {SelectServiceBuilder} from './service';
import {jsonAgg, toJson} from 'ship-hold-querybuilder';

export const enum RelationType {
    BELONGS_TO = 'BELONGS_TO',
    HAS_ONE = 'HAS_ONE',
    HAS_MANY = 'HAS_MANY',
    BELONGS_TO_MANY = 'BELONGS_TO_MANY'
}

export interface RelationDefinition {
    type: RelationType;
    alias: string;
    foreignKey?: string;
}

export const buildRelation = (target: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const relDef = target.service.getRelationWith(relationBuilder.service);
    const reverse = relationBuilder.service.getRelationWith(target.service);

    if (relDef.type === RelationType.HAS_MANY) {
        return oneToMany(target, relationBuilder);
    }

    if (relDef.type === RelationType.HAS_ONE) {
        return hasOne(target, relationBuilder);
    }

    if (relDef.type === RelationType.BELONGS_TO && reverse.type === RelationType.HAS_MANY) {
        return manyToOne(target, relationBuilder);
    }

    if (relDef.type === RelationType.BELONGS_TO && reverse.type === RelationType.HAS_ONE) {
        return oneBelongsToOne(target, relationBuilder);
    }

    //todo many to many


    throw new Error('Unknown relation type');
};

const has = aggregateFunc => (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {alias} = targetBuilder.service.getRelationWith(relationBuilder.service);
    const {foreignKey} = relationBuilder.service.getRelationWith(targetBuilder.service);
    const {table: targetTable, primaryKey} = targetBuilder.service.definition;
    const {table: relationTable} = relationBuilder.service.definition;

    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;

    const leftOperand = `"${relationTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(primaryKey);
    const selectRightOperand = `"${targetTable}"."${primaryKey}"`;
    return targetBuilder
        .select({
            value: relSelect(aggregateFunc(`"${relationTable}".*`, alias))
                .where(
                    leftOperand,
                    selectRightOperand)
                .noop()
        })
        .with(relationTable,
            // @ts-ignore
            relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};

const oneToMany = has(jsonAgg);

const manyToOne = (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {foreignKey, alias} = targetBuilder.service.getRelationWith(relationBuilder.service);
    const {table: targetTable} = targetBuilder.service.definition;
    const {primaryKey, table: relTable} = relationBuilder.service.definition;

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

const oneBelongsToOne = (targetBuilder: SelectServiceBuilder, relationBuilder: SelectServiceBuilder) => {
    const {foreignKey, alias} = targetBuilder.service.getRelationWith(relationBuilder.service);
    const {table: targetTable} = targetBuilder.service.definition;
    const {table: relationTable, primaryKey} = relationBuilder.service.definition;

    const relSelect = relationBuilder.service.select;
    const targetSelect = targetBuilder.service.select;

    const leftOperand = `"${relationTable}"."${primaryKey}"`;
    const rightOperand = `"${targetTable}"."${foreignKey}"`;
    const withRightOperand = targetSelect(foreignKey);

    return targetBuilder
        .select({
            value: relSelect(toJson(`"${relationTable}".*`, alias))
                .where(
                    leftOperand,
                    rightOperand)
                .noop()
        })
        .with(relationTable,
            // @ts-ignore
            relationBuilder.where(leftOperand, 'IN', withRightOperand).noop());
};
