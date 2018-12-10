const Tags = sh.service({
    table: 'tags',
    primaryKey: 'tag'
});

const Posts = sh.service({
    table: 'posts',
    primaryKey: 'post_id'
});

//A tag can be applied to many posts
Tags.belongsToMany(Posts, 'posts_tag', 'tag', 'posts');

//A posts may be tagged with multiple tags
Posts.belongsToMany(Tags, 'posts_tag', 'post_id', 'tags');
