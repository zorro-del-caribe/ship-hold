module.exports = function (sh) {
  return sh.getConnection()
    .then(function ({client, done}) {

      return new Promise(function (resolve, reject) {
        let remaining = 5;

        function jobDone () {
          remaining--;
          if (remaining === 0) {
            console.log('RRRRRRRREEEEEESOOOOOOLV')
            
            sh.stop();
            resolve();
          }
        }

        client.query('DROP TABLE IF EXISTS users_simple_select', function (err, result) {
          if (err) {
            throw err;
          }

          const createq = `CREATE TABLE users_simple_select
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

        client.query('DROP TABLE IF EXISTS users_update', function (err, result) {
          if (err) {
            throw err;
          }

          const createq = `CREATE TABLE users_update
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

        client.query('DROP TABLE IF EXISTS users_delete', function (err, result) {
          if (err) {
            throw err;
          }

          const createq = `CREATE TABLE users_delete
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

        client.query('DROP TABLE if EXISTS users_insert', function (err, result) {
          const createQ = `CREATE TABLE users_insert
    (
    id serial PRIMARY KEY,
    age integer,
    name varchar(100)
    );
    `;
          client.query(createQ, function (err, result) {
            if (err) {
              throw err;
            }
            done();
            jobDone();
          });

        });

        client.query(`DROP TABLE IF EXISTS 
  users_association_select, 
  products_association_select, 
  phones_association_select, 
  accounts_association_select,
  users_accounts_association_select
  ;`, function (err, result) {

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
    
    CREATE TABLE accounts_association_select
    (
    id serial PRIMARY KEY,
    balance double precision
    );
    
    CREATE TABLE users_accounts_association_select
    (
    id serial PRIMARY KEY,
    user_id integer REFERENCES users_association_select,
    account_id integer REFERENCES accounts_association_select
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
    })
    .catch(e=>console.log(e));
};