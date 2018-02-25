const {Pool} = require('pg');

module.exports = (conf) => {
	const pool = new Pool(conf);
	return {
		query(q) {
			return pool.query(q);
		},
		connect() {
			return pool.connect();
		},
		stop() {
			return pool.end();
		}
	};
};