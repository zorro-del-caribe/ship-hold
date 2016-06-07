const pg = require('pg');
const connection = 'postgres://docker:docker@192.168.99.100:5432/ship-hold-test';
const test = require('tape');

let remaining = 2;
function jobDone () {
  remaining--;
  if (remaining === 0) {
    pg.end();
  }
}

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
      jobDone();
    });
  });
});

pg.connect(connection, function (err, client, done) {
  if (err) {
    throw err;
  }

  const dropq = 'DROP TABLE IF EXISTS users_association_select, products_association_select, phones_association_select';
  client.query(dropq, function (err, result) {

    if (err) {
      throw err;
    }

    const createq = `CREATE TABLE users_association_select
    (
    id serial PRIMARY KEY,
    age integer,
    name varchar(100)
    );
    
    CREATE TABLE products_association_select
    (
    id serial PRIMARY KEY,
    price double precision,
    sku varchar(3),
    title varchar(100),
    user_id integer REFERENCES users_association_select
    );
    
    CREATE TABLE phones_association_select
    (
    id serial PRIMARY KEY,
    number varchar(100),
    user_id integer REFERENCES users_association_select
    );
    `;

    client.query(createq, function (err) {
      if (err) {
        throw err;
      }
      done();
      jobDone();
    });
  });
});