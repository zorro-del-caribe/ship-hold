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
    posts: function () {
        return this.hasMany(Posts, 'user_id', 'user_id');
    },
    comments: function () {
        return this.hasMany(Comments, 'user_id', 'user_id');
    }
});
const Posts = bookshelf.Model.extend({
    tableName: 'posts',
    author: function () {
        return this.belongsTo(Users, 'user_id', 'user_id');
    },
    comments: function () {
        return this.hasMany(Comments, 'post_id', 'post_id');
    }
});
const Comments = bookshelf.Model.extend({
    tableName: 'comments',
    author: function () {
        return this.belongsTo(Users, 'user_id', 'user_id');
    },
    post: function () {
        return this.belongsTo(Posts, 'user_id', 'user_id');
    }
});

exports.Posts = Posts;
exports.Users = Users;
