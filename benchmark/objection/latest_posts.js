const {pageSize} = require('../config/bench');
const {User, knex, Post} = require('./models');

(async function () {
    try {
        const start = Date.now();
        const posts = await Post
            .query()
            .orderBy('published_at', 'desc')
            .limit(pageSize)
            .eager('[author, comments.author, tags]')
            .modifyEager('comments', builder => {
                builder
                    .orderBy('published_at', 'desc');
            })
            .modifyEager('tags', builder => {
                builder.select('tags.tag');
            });

        // Not possible to have it right: https://github.com/Vincit/objection.js/issues/848
        const rightPosts = posts.map(p => Object.assign(p, {comments: p.comments.slice(0, 3)}));

        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(rightPosts));
    } catch (e) {
        console.log(e);
    } finally {
        knex.destroy();
    }
})();
