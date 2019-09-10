import { InclusionInput, SelectServiceBuilder, ShipHoldBuilders } from '../interfaces';
export declare const morphBuilder: (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relation: InclusionInput) => SelectServiceBuilder;
