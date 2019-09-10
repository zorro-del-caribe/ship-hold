import {EntityService, RelationArgument, SelectServiceBuilder, ShipHoldBuilders, WithInclusion} from '../interfaces';
import {normaliseInclude} from './utils';
import {morphBuilder} from './relations';

type BuilderWithInclude = SelectServiceBuilder & WithInclusion;

export const withInclude = (aliasToService: Map<string, EntityService>, sh: ShipHoldBuilders) => {
    return (target: SelectServiceBuilder): BuilderWithInclude => {
        const include = withInclude(aliasToService, sh);

        const originalBuild = Object.getPrototypeOf(target).build.bind(target);
        const originalClone = Object.getPrototypeOf(target).clone.bind(target);

        return Object.assign(target, {
            inclusions: [],
            include(this: BuilderWithInclude, ...relations: RelationArgument[]) {
                this.inclusions.push(...relations
                    .map(normaliseInclude(aliasToService, target)));
                return this;
            },
            clone(deep = true) {
                const clone = include(<SelectServiceBuilder>originalClone());
                if (deep === true && this.inclusions.length) {
                    clone.include(...this.inclusions.map(({as, value}: { as: string, value: SelectServiceBuilder }) => {
                        const relationClone = value.clone();
                        return {
                            as,
                            value: relationClone
                        };
                    }));
                }
                return clone;
            },
            toBuilder(this: SelectServiceBuilder) {
                const clone = this.clone();
                const fullRelationsList: {as: string, value: SelectServiceBuilder}[] = [{
                    as: target.cte,
                    value: clone
                }, ...(clone as BuilderWithInclude).inclusions];
                clone.inclusions.splice(0); // empty list
                return include(fullRelationsList.reduce(morphBuilder(sh), clone));
            },
            build(params: object, offset: number) {
                if (this.inclusions.length === 0) {
                    return originalBuild(params, offset);
                }

                return this.toBuilder().build(params, offset);
            }
        });
    };
};
