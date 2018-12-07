import {EntityDefinition, EntityService} from './builders';

export interface ServiceRegistry extends Iterable<[string, EntityService]> {
    service(def: EntityDefinition | string): EntityService;
}
