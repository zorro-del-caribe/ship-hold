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
        return { builder: service.select(), as: rel };
    }
    const builder = ('build' in rel ? rel : rel.select()).noop();
    const as = targetBuilder.service.getRelationWith(builder.service).alias;
    return {
        builder: builder,
        as
    };
};
export const setAsServiceBuilder = (service) => {
    const { table, primaryKey } = service.definition;
    return (builder, tableName = table) => Object.defineProperties(builder, {
        service: { value: service },
        cte: { value: tableName },
        primaryKey: { value: primaryKey }
    });
};
