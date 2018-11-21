const {hostname: host, username: user, password, database} = require('../config/db');
const {shiphold} = require('../../dist/bundle');

const sh = shiphold({host, user, password, database});

const Users = sh.service({
    name: 'users',
    table: 'users',
    primaryKey: 'user_id'
});

const Posts = sh.service({
    name: 'posts',
    table: 'posts',
    primaryKey: 'post_id'
});

const Comments = sh.service({
    name: 'comments',
    table: 'comments',
    primaryKey: 'comment_id'
});

Users.hasMany(Posts);
Posts.belongsTo(Users, 'user_id', 'author');

Users.hasMany(Comments);
Posts.hasMany(Comments);
Comments.belongsTo(Users, 'user_id', 'author');
Comments.belongsTo(Posts, 'post_id', 'article');


exports.sh = sh;
exports.Users = Users;
exports.Posts = Posts;
exports.Comments = Comments;
