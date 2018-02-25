module.exports = async function (sh) {
	const {query} = sh;
	try {
		await query('SELECT now()'); // Ping
		await query('DROP TABLE IF EXISTS users_simple_select');
		await query(`CREATE TABLE users_simple_select
					(
					id serial PRIMARY KEY,
					age integer,
					name varchar(100)
					);`);
		await query('DROP TABLE IF EXISTS users_update');
		await query(`CREATE TABLE users_update
					(
					id serial PRIMARY KEY,
					age integer,
					name varchar(100)
					);`);
		await query('DROP TABLE IF EXISTS users_delete');
		await query(`CREATE TABLE users_delete
    (
    id serial PRIMARY KEY,
    age integer,
    name varchar(100)
    );`);
		await query('DROP TABLE if EXISTS users_insert');
		await query(`CREATE TABLE users_insert
    (
    id serial PRIMARY KEY,
    age integer,
    name varchar(100)
    );
    `);
		await query(`DROP TABLE IF EXISTS
  users_association_select,
  products_association_select,
  phones_association_select,
  accounts_association_select,
  users_accounts_association_select
  ;`);
		await query(`CREATE TABLE users_association_select
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
    `);
	} catch (e) {
		console.error(e);
		sh.stop();
		process.exit(1);
	}
};