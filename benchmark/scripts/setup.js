const {sh} = require('./ship-hold');

(async () => {
	const {query} = sh;
	try {
		await query(`DROP TABLE IF EXISTS users, products;`);
		await query(`CREATE TABLE users
        (
        id serial PRIMARY KEY,
        age integer,
        name varchar(100),
        email varchar(100),
        username varchar(100),
        country varchar(3),
        created_at timestamp,
        updated_at timestamp
        );`);

		await query(`CREATE TABLE products
          (
          id serial PRIMARY KEY,
          sku character varying(255),
          title character varying(255),
          stock integer,
          price double precision,
          created_at timestamp,
          updated_at timestamp,
          user_id integer REFERENCES users
          )`);

	} catch (e) {
		console.log(e);
		process.exit(1);
	} finally {
		console.log(`set up done`);
		sh.stop();
	}
})();