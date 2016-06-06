const pg = require('pg');
const connection = 'postgres://docker:docker@192.168.99.100:5432/ship-hold-test';
const test = require('tape');

pg.connect(connection, function (err, client, done) {
  if (err) {
    throw err;
  }

  const dropq = `DROP TABLE IF EXISTS user_simple_select`;

  client.query(dropq, function (err, result) {
    if (err) {
      throw err;
    }

    const createq = `CREATE TABLE user_simple_select
    (
    id serial PRIMARY KEY,
    age integer,
    name varchar(100)
    );`;

    client.query(createq, function (err, result) {
      if (err) {
        throw err;
      }
      done();
      pg.end();
    })
  });
});