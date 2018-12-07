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

Users.hasMany(Posts);
Posts.belongsTo(Users, 'user_id', 'author');

Users.hasMany(Comments);
Posts.hasMany(Comments);
Comments.belongsTo(Users, 'user_id', 'author');
Comments.belongsTo(Posts, 'post_id', 'article');

Posts.belongsToMany(Tags, 'posts_tags', 'post_id');
Tags.belongsToMany(Posts, 'posts_tags', 'tag');
