import { InclusionInput, SelectServiceBuilder, ShipHoldBuilders } from '../interfaces';
export declare const buildRelation: (sh: ShipHoldBuilders) => (targetBuilder: SelectServiceBuilder, relation: InclusionInput) => any;
