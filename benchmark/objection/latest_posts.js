const {iterations, pageSize, breath} = require('../config/bench');
const {User, knex, Post} = require('./models');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

(async function () {
    try {
        let iter = 1;
        const collector = collectorFactory();
        // while (iter <= iterations) {
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

        const rightPosts = posts.map(p => Object.assign(p, {comments: p.comments.slice(0, 3)}));

        // Not possible to have it right: https://github.com/Vincit/objection.js/issues/848

        const executionTime = Date.now() - start;
        // collector.collect(executionTime);
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(rightPosts));
        await wait();
        iter++;
        // }
        // collector.print();
    } catch (e) {
        console.log(e);
    } finally {
        knex.destroy();
    }
})();
