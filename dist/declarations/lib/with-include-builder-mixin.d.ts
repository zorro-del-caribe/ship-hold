import { EntityService, SelectServiceBuilder, ShipHoldBuilders, WithInclusion } from '../interfaces';
declare type BuilderWithInclude = SelectServiceBuilder & WithInclusion<SelectServiceBuilder>;
export declare const withInclude: (aliasToService: Map<string, EntityService>, sh: ShipHoldBuilders) => (target: SelectServiceBuilder) => BuilderWithInclude;
export {};
