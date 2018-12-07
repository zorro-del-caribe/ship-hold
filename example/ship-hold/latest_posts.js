const {pageSize} = require('../config/example');
const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');

(async function () {
    try {
        const now = Date.now();
        const posts = await Posts
            .select()
            .orderBy('published_at', 'desc')
            .limit(pageSize)
            .include(
                Comments
                    .select()
                    .orderBy('published_at', 'desc')
                    .limit(3)
                    .include(Users),
                Tags.select('tag'),
                Users.select()
            )
            .run();
        console.log(`executed in ${Date.now() - now}ms`);
        // console.log(JSON.stringify(posts));
    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

