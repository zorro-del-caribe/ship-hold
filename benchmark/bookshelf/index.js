const {hostname: host, username: user, password, database} = require('../config/db');
const {shiphold} = require('../../dist/bundle');

const sh = shiphold({
    host,
    user,
    password,
    database: 'ship-hold-test'
});

const Users = sh.service({
    table: 'users_association_select',
    primaryKey: 'id',
    name: 'Users'
});

const Products = sh.service({
    table: 'products_association_select',
    name: 'Products',
    primaryKey: 'id'
});

const Phones = sh.service({
    table: 'phones_association_select',
    name: 'Phones',
    primaryKey: 'id'
});

const Accounts = sh.service({
    name: 'Accounts',
    table: 'accounts_association_select',
    primaryKey: 'id'
});

const UsersAccounts = sh.service({
    table: 'users_accounts_associations_select',
    name: 'UsersAccounts',
    primaryKey: 'id'
});

Users.hasMany(Products, 'products');
Products.belongsTo(Users, 'user_id', 'owner');

Users.hasOne(Phones, 'phone');
Phones.belongsTo(Users, 'user_id');

Users.belongsToMany(Accounts, 'users_accounts_association_select', 'user_id', 'money');
Accounts.belongsToMany(Users, 'users_accounts_association_select', 'account_id', 'owners');

(async function () {
    const items = await Users
        .select()
        .orderBy('id')
        .include(
            Accounts.select()
        )
        .debug();
    console.table(items);

    // console.dir(await Accounts.select().orderBy('balance').include(Users.select().include(Products.select())).debug());
})();

/*
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
        return this.hasMany(Products, 'user_id');
    }
});
const Products = bookshelf.Model.extend({
    tableName: 'products',
    owner: function () {
        return this.belongsTo(Users);
    }
});


(async function () {
    const now = Date.now();
    const products =await Products
        .query(function (qb) {
            qb
                .where('products.price', '<', 30)
                .orderBy('price')
                .limit(200)
        })
        .fetchAll({withRelated: ['owner']});
    console.log(Date.now() - now);

})();

exports.Products = Products;
exports.Users = Users;
*/

// (async function () {
//     const {Pool} = require('pg');
//     const p = new Pool({
//         host,
//         user,
//         password,
//         database
//     });
//     const now = Date.now();
//     const products = await p.query(`WITH "products" AS (SELECT * FROM "products" WHERE "price" < 30 ORDER BY "price" LIMIT 10),
// "users" AS (SELECT * FROM "users" WHERE "id" IN (SELECT "user_id" FROM "products"))
// SELECT "products".*, to_json("users".*) AS "owner" FROM "products" LEFT JOIN "users" ON "products"."user_id" = "users"."id" ORDER BY "price"`);
//     console.log(Date.now() - now);
//     console.table(products.rows);
//
// })();
