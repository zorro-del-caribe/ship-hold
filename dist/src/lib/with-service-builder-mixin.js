/**
 * Create a functional mixin to be applied to a builder to pass metadata related to the service and context the builder was generated with
 * Note: the metadata are part of the "identity" of the builder and therefore are copied when cloning a builder
 * @param {EntityService} service
 * @returns {WithServiceBuilderMixin}
 */
export const setAsServiceBuilder = (service) => {
    const { table, primaryKey } = service.definition;
    return (builder, tableName = table) => Object.defineProperties(builder, {
        service: { value: service, enumerable: true },
        cte: { value: tableName, enumerable: true, writable: true },
        primaryKey: { value: primaryKey, enumerable: true }
    });
};
