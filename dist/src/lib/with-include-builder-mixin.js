import { normaliseInclude } from './utils';
import { changeFromRelation } from './relations';
export const withInclude = (aliasToService, sh) => {
    return (target) => {
        const inclusions = [];
        const include = withInclude(aliasToService, sh);
        const originalBuild = Object.getPrototypeOf(target).build.bind(target);
        const originalClone = Object.getPrototypeOf(target).clone.bind(target);
        return Object.assign(target, {
            inclusions,
            include(...relations) {
                inclusions.push(...relations
                    .map(normaliseInclude(aliasToService, target)));
                return this;
            },
            clone() {
                const clone = include(originalClone());
                if (inclusions.length) {
                    clone.include(...inclusions.map(({ as, builder }) => {
                        const relationClone = builder.clone();
                        relationClone.parentBuilder = clone;
                        return {
                            as,
                            builder: relationClone
                        };
                    }));
                }
                return clone;
            },
            toBuilder() {
                const clone = this.clone();
                const fullRelationsList = [{
                        as: target.cte,
                        builder: clone
                    }, ...clone.inclusions];
                clone.inclusions.splice(0); // empty list
                return include(fullRelationsList.reduce(changeFromRelation(sh), clone));
            },
            build(params, offset) {
                if (inclusions.length === 0) {
                    return originalBuild(params, offset);
                }
                return this.toBuilder().build(params, offset);
            }
        });
    };
};
