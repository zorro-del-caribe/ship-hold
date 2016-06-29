const debug = require('debug')('ship-hold');
const relationDefinitions = require('./relations').definitions;
const modelFactory = require('./model');

const registry = Object.create(null);

module.exports = function (options = {}) {
  const {shiphold} = options;
  return {
    models(){
      return Object.keys(registry);
    },
    model(key, defFunc){
      if (defFunc) {
        const definition = defFunc(relationDefinitions);
        debug('registering model '+key);
        registry[key] = modelFactory(Object.assign({}, {definition, shiphold: shiphold || this, name: key}));
      }
      if (registry[key] === undefined) {
        throw new Error('could not find the model ' + key);
      }
      return registry[key];
    }
  };
};