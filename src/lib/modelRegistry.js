const debug = require('debug')('ship-hold');
const relationDefinitions = require('./relationDefinitions');
const modelFactory = require('./model');

module.exports = function (options = {}) {
  const registry = Object.create(null);
  const {shiphold} = options;
  return {
    models(){
      return Object.keys(registry);
    },
    model(key, defFunc){
      if (defFunc) {
        const definition = defFunc(relationDefinitions);
        const columnsDefinition = definition.columns;
        for (const column of Object.keys(columnsDefinition)) {
          const def = columnsDefinition[column];
          if (typeof def === 'string') {
            columnsDefinition[column] = {type: def};
          }
        }
        debug('registering model ' + key);
        registry[key] = modelFactory(Object.assign({}, {definition, shiphold: shiphold || this, name: key}));
      }
      if (registry[key] === undefined) {
        throw new Error('could not find the model ' + key);
      }
      return registry[key];
    }
  };
};