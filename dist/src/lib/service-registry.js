import { service } from './service';
import { toCamelCase } from './utils';
// Create a registry of services bound to a specific table
export const serviceRegistry = (builders) => {
    const registry = new Map();
    const getService = (name) => {
        if (registry.has(name) === false) {
            throw new Error(`could not find the model ${name}`);
        }
        return registry.get(name);
    };
    const setService = function (def) {
        const definition = Object.assign({ primaryKey: 'id', name: toCamelCase(def.table) }, def);
        const { name } = definition;
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
