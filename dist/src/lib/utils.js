const isNormalized = (val) => {
    return typeof val === 'object' && 'as' in val;
};
export const normaliseInclude = (aliasToService, targetBuilder) => (rel) => {
    if (isNormalized(rel)) {
        return rel;
    }
    // Alias
    if (typeof rel === 'string') {
        const service = aliasToService.get(rel);
        return { value: service.select(), as: rel };
    }
    const builder = ('build' in rel ? rel : rel.select()).noop();
    const as = targetBuilder.service.getRelationWith(builder.service).alias;
    return {
        value: builder,
        as
    };
};
const uppercaseTheFirstLetter = (word) => {
    const [first, ...rest] = word;
    return [first.toUpperCase(), ...rest].join('');
};
export const toCamelCase = (input) => {
    return input
        .split('_')
        .map(uppercaseTheFirstLetter)
        .join();
};
