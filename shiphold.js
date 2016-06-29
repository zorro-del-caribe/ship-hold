const url = require('url');
const modelRegistry = require('./lib/modelRegistry');
const adapters = require('./lib/adapterExtensions');
const shipHoldQueryBuilder = require('ship-hold-querybuilder');
const connector = require('./lib/connections');
const runnerFactory = require('./lib/runner');

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
  const queries = shipHoldQueryBuilder();

  const prototype = {};
  ['select', 'insert', 'update', 'delete'].forEach(method=> {
    prototype[method] = function () {
      const builder = queries[method](...arguments);
      return Object.assign(builder, this.runner({builder}));
    }
  });

  prototype.if = function () {
    return queries.condition().if(...arguments);
  };

  Object.assign(prototype, connector({connectionString}), modelRegistry(), runnerFactory());

  return Object.create(prototype, {
    aggregate: {
      value: queries.aggregate
    },
    adapters: {
      value: adapters
    },
    nodes: {
      value: queries.nodes
    }
  });
};