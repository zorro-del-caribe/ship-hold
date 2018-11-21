const Sequelize = require('sequelize');

const seq = new Sequelize('postgres://docker:docker@localhost/ship-hold-bench', {logging: false});

const Users = seq.define('users', {
    user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    biography: Sequelize.STRING,
    email: Sequelize.STRING,
}, {underscored: true});

const Posts = seq.define('posts', {
    post_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    title: Sequelize.STRING,
    content: Sequelize.STRING,
    published_at: Sequelize.DATE,
    user_id: {
        type: Sequelize.INTEGER
    }
}, {underscored: true});

Posts.belongsTo(Users);
Users.hasMany(Posts);

exports.seq = seq;
exports.Users = Users;
exports.Posts = Posts;
