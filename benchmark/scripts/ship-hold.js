const {hostname: host, username: user, password, database} = require('../config/db');
const {default:shiphold} = require('../../src/shiphold');

const sh = shiphold({host, user, password, database});
const Users = sh.model('users', function (sc) {
	return {
		table: 'users',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string',
			email: 'string',
			username: 'string',
			country: 'string',
			created_at: 'date',
			updated_at: 'date'
		},
		relations: {
			products: sc.hasMany('products')
		}
	}
});
const Products = sh.model('products', function (sc) {
	return {
		table: 'products',
		columns: {
			id: 'integer',
			price: 'double',
			title: 'string',
			user_id: 'integer',
			sku: 'string',
			stock: 'integer',
			created_at: 'date',
			updated_at: 'date'
		},
		relations: {
			user: sc.belongsTo('users', 'user_id')
		}
	}
});

exports.sh = sh;
exports.Users = Users;
exports.Products = Products;