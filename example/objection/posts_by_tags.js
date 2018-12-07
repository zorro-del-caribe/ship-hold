const {User, knex, Tag, Post} = require('./models');

(async function () {
    try {
        const start = Date.now();
        const [tag] = await Tag
            .query()
            .where('tag', 'nisi')
            .eager('posts.[author, comments]')
            .modifyEager('posts', builder => {
                builder
                    .orderBy('published_at', 'desc');
            })
            .modifyEager('posts.comments', builder => {
                builder
                    .orderBy('published_at', 'desc');
            });

        // Not possible to have it right: https://github.com/Vincit/objection.js/issues/848
        tag.posts = tag.posts.slice(0, 5).map(p => {
            p.comments = p.comments.slice(0, 3);
            return p;
        });
        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        // console.log(JSON.stringify(tag));
    } catch (e) {
        console.log(e);
    } finally {
        knex.destroy();
    }
})();
