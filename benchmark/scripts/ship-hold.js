const {hostname: host, username: user, password, database} = require('../config/db');
const {shiphold} = require('../../dist/bundle');

const sh = shiphold({host, user, password, database});

const Users = sh.service({
    name: 'Users',
    table: 'users',
    primaryKey: 'user_id'
});

const Posts = sh.service({
    name: 'Posts',
    table: 'posts',
    primaryKey: 'post_id'
});

const Comments = sh.service({
    name: 'Comments',
    table: 'comments',
    primaryKey: 'comment_id'
});

const Tags = sh.service({
    name: 'Tags',
    table: 'tags',
    primaryKey: 'tag'
});

const PostsTags = sh.service({
    name: 'PostsTags',
    table: 'posts_tags',
});


Users.hasMany(Posts);
Posts.belongsTo(Users, 'user_id', 'author');

Users.hasMany(Comments);
Posts.hasMany(Comments);
Comments.belongsTo(Users, 'user_id', 'author');
Comments.belongsTo(Posts, 'post_id', 'article');

Posts.belongsToMany(Tags, 'posts_tags', 'post_id');
Tags.belongsToMany(Posts, 'posts_tags', 'tag');

Tags.hasMany(PostsTags);
PostsTags.belongsTo(Tags, 'tag');
Posts.hasMany(PostsTags);
PostsTags.belongsTo(Posts,'post_id');

exports.sh = sh;
exports.Users = Users;
exports.Posts = Posts;
exports.Comments = Comments;
exports.Tags = Tags;
exports.PostsTags = PostsTags;
