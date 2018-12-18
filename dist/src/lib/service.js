import { withRelation } from './with-relations-service-mixin';
import { withInclude } from './with-include-builder-mixin';
import { setAsServiceBuilder } from './with-service-builder-mixin';
export const service = (definition, sh) => {
    const { table } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    const include = withInclude(aliasToService, sh);
    let setAsServiceB;
    //todo might worth use polymorphic this type instead to explicitly cast
    // (https://devdocs.io/typescript/handbook/advanced-types#polymorphic-this-types)
    const ServicePrototype = Object.assign({
        rawSelect: (...args) => {
            return setAsServiceB(include(sh
                .select(...args)));
        },
        select: (...args) => {
            return setAsServiceB(include(sh
                .select(...args)
                .from(table)));
        },
        insert: (...args) => setAsServiceB(sh
            .insert(...args)
            .into(table)
            .returning('*')),
        update: (map = {}) => {
            const builder = sh
                .update(table)
                .returning('*');
            for (const [key, value] of Object.entries(map)) {
                builder.set(key, value);
            }
            return setAsServiceB(builder);
        },
        delete: () => setAsServiceB(sh.delete(table)),
        if: (leftOperand, ...rest) => sh.if(leftOperand, ...rest)
    }, withRelation(serviceToRelation, aliasToService));
    const serviceInstance = Object.create(ServicePrototype, {
        definition: { value: Object.freeze(definition) }
    });
    setAsServiceB = setAsServiceBuilder(serviceInstance);
    return serviceInstance;
};
