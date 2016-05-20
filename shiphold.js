const models = require('./lib/model');
const url = require('url');

const shipHold = function (connect) {
  const connection = Object.assign({}, {
    protocol: 'postgres',
    slashses: true,
    hostname: 'localhost',
    port: 5432
  }, connect);
  if (connect.username && connect.password) {
    const {username, password} = connect;
    connection.auth = [username, password].join(':')
  }
  connection.pathname = connect.database;
  const connectionString = url.format(connection);
  const registry = Object.create(null);
  return {
    model: function (key, definition) {
      if (definition) {
        registry.set(key, definition);
      }
      if (registry.has(key) === false) {
        throw new Error('could not find the model %s', key);
      }
      return models(Object.assign({}, definition, {connectionString}));
    }
  }
};

const shipHoldStamp = stampit()
  .init(function () {
    const connection = '';
    const connectionString = this.connectionString;
    const registry = new Map();
    delete this.connection;
    this.model = function (key, definition) {
      if (definition) {
        registry.set(key, definition);
      }
      if (registry.has(key) === false) {
        throw new Error('could not find the model %s', key);
      }
      return models(Object.assign({}, definition, {connectionString}));
    }
  });

module.exports = shipHoldStamp;
