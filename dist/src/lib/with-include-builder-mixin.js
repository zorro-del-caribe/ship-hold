import { normaliseInclude } from './utils';
import { morphBuilder } from './relations';
export const withInclude = (aliasToService, sh) => {
    return (target) => {
        const include = withInclude(aliasToService, sh);
        const originalBuild = Object.getPrototypeOf(target).build.bind(target);
        const originalClone = Object.getPrototypeOf(target).clone.bind(target);
        return Object.assign(target, {
            inclusions: [],
            include(...relations) {
                this.inclusions.push(...relations
                    .map(normaliseInclude(aliasToService, target)));
                return this;
            },
            clone(deep = true) {
                const clone = include(originalClone());
                if (deep === true && this.inclusions.length) {
                    clone.include(...this.inclusions.map(({ as, value }) => {
                        const relationClone = value.clone();
                        return {
                            as,
                            value: relationClone
                        };
                    }));
                }
                return clone;
            },
            toBuilder() {
                const clone = this.clone();
                const fullRelationsList = [{
                        as: target.cte,
                        value: clone
                    }, ...clone.inclusions];
                clone.inclusions.splice(0); // empty list
                return include(fullRelationsList.reduce(morphBuilder(sh), clone));
            },
            build(params, offset) {
                if (this.inclusions.length === 0) {
                    return originalBuild(params, offset);
                }
                return this.toBuilder().build(params, offset);
            }
        });
    };
};
