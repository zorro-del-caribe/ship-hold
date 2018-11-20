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


exports.sh = sh;
exports.Users = Users;
exports.Posts = Posts;
