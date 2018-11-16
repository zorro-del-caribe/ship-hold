import { EntityDefinition, EntityService } from './service';
import { ShipHoldBuilders } from './builders';
export interface ServiceRegistry extends Iterable<[string, EntityService]> {
    service(def: EntityDefinition | string): EntityService;
}
export declare const serviceRegistry: (builders: ShipHoldBuilders) => ServiceRegistry;
