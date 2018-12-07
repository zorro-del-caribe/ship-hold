const {User, knex, Post} = require('./models');

(async function () {
    try {
        const start = Date.now();
        const [user] = await User
            .query()
            .where('user_id', 38778)
            .eager('[comments.post.author, posts]')
            .modifyEager('comments', builder => {
                builder.orderBy('published_at', 'desc');
            })
            .modifyEager('posts', builder => {
                builder.orderBy('published_at', 'desc');
            });

        // Not possible to have it right: https://github.com/Vincit/objection.js/issues/848
        const limitedComments = user.comments.slice(0, 5);
        const limitedPosts = user.posts.slice(0, 5);
        user.comments = limitedComments;
        user.posts = limitedPosts;
        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        // console.log(JSON.stringify(user));
    } catch (e) {
        console.log(e);
    } finally {
        knex.destroy();
    }
})();
