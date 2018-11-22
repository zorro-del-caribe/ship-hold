import {EntityService, InclusionInput, RelationArgument, SelectServiceBuilder} from '../interfaces';
import {Builder} from 'ship-hold-querybuilder';

const isNormalized = (val: RelationArgument): val is InclusionInput => {
    return typeof val === 'object' && 'as' in val;
};

export const normaliseInclude = (aliasToService: Map<string, EntityService>, targetBuilder: SelectServiceBuilder) =>
    (rel: RelationArgument): InclusionInput => {

        if (isNormalized(rel)) {
            return rel;
        }

        // Alias
        if (typeof rel === 'string') {
            const service = aliasToService.get(rel);
            return {builder: service.select(), as: rel};
        }

        const builder = <SelectServiceBuilder>('build' in rel ? rel : rel.select()).noop();
        const as = targetBuilder.service.getRelationWith(builder.service).alias;

        return {
            builder: builder,
            as
        };
    };

export const setAsServiceBuilder = (service: EntityService) => {

    const {table, primaryKey} = service.definition;

    return (builder: Builder, tableName = table) => Object.defineProperties(builder, {
        service: {value: service},
        cte: {value: tableName},
        primaryKey: {value: primaryKey}
    });
};
