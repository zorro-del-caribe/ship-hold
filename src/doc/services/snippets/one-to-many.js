const Users = sh.service({
    table: 'users',
    primaryKey: 'user_id'
});

const Posts = sh.service({
    table: 'posts',
    primaryKey: 'post_id'
});

//A user may have written several posts
Users.hasMany(Posts, 'articles');

//A post has only one author
Posts.belongsTo(Users, 'user_id', 'author');
