const sequelize = require('sequelize');

const seq = new sequelize('postgres://docker:docker@localhost/ship-hold-bench', {logging: false});

const Users = seq.define('users', {
	id: {
		type: sequelize.INTEGER,
		primaryKey: true
	},
	age: sequelize.INTEGER,
	name: sequelize.STRING,
	email: sequelize.STRING,
	username: sequelize.STRING,
	country: sequelize.STRING,
	created_at: sequelize.DATE,
	updated_at: sequelize.DATE
}, {underscored: true});

const Products = seq.define('products', {
	id: {
		type: sequelize.INTEGER,
		primaryKey: true
	},
	price: sequelize.FLOAT,
	title: sequelize.STRING,
	sku: sequelize.STRING,
	stock: sequelize.INTEGER,
	created_at: sequelize.DATE,
	updated_at: sequelize.DATE
}, {underscored: true});

Products.belongsTo(Users);
Users.hasMany(Products);

exports.seq = seq;
exports.Users = Users;
exports.Products = Products;