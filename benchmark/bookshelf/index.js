const {hostname: host, username: user, password, database} = require('../config/db');
const knex = require('knex')({
	client: 'pg',
	connection: {
		host,
		user,
		password,
		database
	}
});

const bookshelf = require('bookshelf')(knex);

const Users = bookshelf.Model.extend({
	tableName: 'users',
	products: function () {
		return this.hasMany(Products, 'user_id')
	}
});
const Products = bookshelf.Model.extend({
	tableName: 'products',
	owner: function () {
		return this.belongsTo(Users);
	}
});

exports.Products = Products;
exports.Users = Users;