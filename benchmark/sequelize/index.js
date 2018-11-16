const Sequelize = require('sequelize');

const seq = new Sequelize('postgres://docker:docker@localhost/ship-hold-bench', {logging: false});

const Users = seq.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    age: Sequelize.INTEGER,
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    username: Sequelize.STRING,
    country: Sequelize.STRING,
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}, {underscored: true});

const Products = seq.define('products', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    price: Sequelize.FLOAT,
    title: Sequelize.STRING,
    sku: Sequelize.STRING,
    stock: Sequelize.INTEGER,
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}, {underscored: true});

Products.belongsTo(Users);
Users.hasMany(Products);

(async function () {
    const start = Date.now();
    const users = await Users
        .findAll({
            include: [Products],
            where: {
                age: {[Sequelize.Op.gt]: 20}
            },
            limit: 20,
            order: ['name']
        });
    console.log(Date.now() - start);
    // console.table(users.map(m => Object.assign({}, m.dataValues, {products: m.products})));
})();

exports.seq = seq;
exports.Users = Users;
exports.Products = Products;
