'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _pg = require('pg');

exports.default = conf => {
	const pool = new _pg.Pool(conf);
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