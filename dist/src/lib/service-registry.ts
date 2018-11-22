import {service} from './service';
import {EntityDefinition, EntityService, ServiceRegistry, ShipHoldBuilders} from '../interfaces';

// Create a registry of services bound to a specific table
export const serviceRegistry = (builders: ShipHoldBuilders): ServiceRegistry => {
    const registry = new Map<string, EntityService>();
    const getService = (name: string) => {
        if (registry.has(name) === false) {
            throw new Error(`could not find the model ${name}`);
        }
        return registry.get(name);
    };
    const setService = function (def: EntityDefinition) {
        const definition = Object.assign({}, def);
        const {name} = definition;
        registry.set(name, service(definition, builders));
        return getService(name);
    };

    return {
        [Symbol.iterator]: () => registry.entries(),
        service(def) {
            return typeof def === 'string' ? getService(def) : setService(def);
        }
    };
};
