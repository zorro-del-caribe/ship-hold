const stampit = require('stampit');

const shipHoldStamp = stampit()
  .init(function () {
    const registry = {};
    this.model = function (key, definition) {
      if (definition) {
        registry[key] = definition;
      }
      if (registry[key] === undefined) {
        throw new Error('could not find the model %s', key);
      }
      return registry[key];
    }
  });

module.exports = shipHoldStamp;