const models = require('./lib/model');
const url = require('url');
const adapters = require('./lib/adapterExtensions');
const shipHoldQueryBuilder = require('ship-hold-querybuilder');
const relationDefinitions = require('./lib/relations').definitions;
const pg = require('pg');

module.exports = function (connect = {}) {
  const connection = Object.assign({}, {
    protocol: 'postgres',
    slashes: true,
    hostname: 'localhost',
    port: 5432
  }, connect);

  if (connect.username && connect.password) {
    const {username, password} = connect;
    connection.auth = [username, password].join(':')
  }

  connection.pathname = '/' + connect.database;
  const connectionString = url.format(connection);

  const registry = Object.create(null);
  return {
    model: function (key, defFunc) {
      if (defFunc) {
        const definition = defFunc(relationDefinitions);
        registry[key] = models(Object.assign({}, {definition, connectionString, shiphold: this, name: key}));
      }
      if (registry[key] === undefined) {
        throw new Error('could not find the model ' + key);
      }
      return registry[key];
    },
    models(){
      return Object.keys(registry);
    },
    adapters,
    query: shipHoldQueryBuilder,
    stop: function () {
      pg.end();
    }
  };
};