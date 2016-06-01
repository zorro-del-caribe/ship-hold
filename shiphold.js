const models = require('./lib/model');
const url = require('url');
const adapters = require('./lib/adapterExtensions');
const shipHoldQueryBuilder = require('ship-hold-querybuilder');

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
  const sh = {
    model: function (key, definition) {
      if (definition) {
        registry[key] = models(Object.assign({}, {definition, connectionString, shiphold: this}));
      }
      if (registry[key] === undefined) {
        throw new Error('could not find the model %s', key);
      }
      return registry[key];
    },
    models(){
      return Object.keys(registry);
    },
    adapters,
    query: shipHoldQueryBuilder
  };
  return sh;
};