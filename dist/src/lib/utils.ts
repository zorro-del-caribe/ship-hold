import {EntityService, InclusionInput, RelationArgument, SelectServiceBuilder} from '../interfaces';

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

const uppercaseTheFirstLetter = (word: string): string => {
    const copy = word;
    copy[0].toUpperCase();
    return copy;
};

export const toCamelCase = (input: string): string => {
    return input
        .split('_')
        .map(uppercaseTheFirstLetter)
        .join();
};
