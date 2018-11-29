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
        const [user] = await User
            .query()
            .where('user_id', 58597)
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
        // collector.collect(executionTime);
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(user));
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
