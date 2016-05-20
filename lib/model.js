const shipHoldBuilder = require('ship-hold-querybuilder');
const runner = require('./extendedBuilder');
const instanceFactory = require('./modelInstance');


module.exports = function (definition, connectionString) {
  const builder = shipHoldBuilder();
  const def = definition;
  Object.freeze(def);
  const table = definition.table;

  const service = Object.create({
    select(...args){
      return Object.assign(builder
        .select(...args)
        .from(table), runner(connectionString));
    },
    insert(...args){
      return Object.assign(builder
        .insert(...args)
        .into(table), runner(connectionString));
    },
    update(){
      return Object.assign(builder
        .update(table), runner(connectionString));
    },
    delete(){
      return Object.assign(builder
        .delete(table), runner(connectionString));
    },
    if(...args){
      return builder
        .if(...args);
    }
  }, {
    definition: {
      get(){
        return Object.assign({}, def);
      }
    }
  });

  service.new = instanceFactory(service);

  return service;
};