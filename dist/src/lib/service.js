import { withRelation } from './with-relations-service-mixin';
import { withInclude } from './with-include-builder-mixin';
import { setAsServiceBuilder } from './with-service-builder-mixin';
export const service = (definition, sh) => {
    const { table } = definition;
    const serviceToRelation = new WeakMap();
    const aliasToService = new Map();
    const include = withInclude(aliasToService, sh);
    let setAsServiceB;
    const ServicePrototype = Object.assign({
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
        definition: { value: Object.freeze(definition) } // Todo should freeze deeply
    });
    setAsServiceB = setAsServiceBuilder(serviceInstance);
    return serviceInstance;
};
