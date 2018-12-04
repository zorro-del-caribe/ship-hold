const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');

(async function () {
    try {
        const start = Date.now();
        const [user] = await Users
            .select()
            .where('user_id', 38778)
            .include(
                Comments
                    .select()
                    .orderBy('published_at', 'desc')
                    .limit(5)
                    .include(
                        Posts
                            .select('post_id', 'user_id', 'title')
                            .include(
                                Users.select('user_id', 'first_name', 'last_name'))
                    ),
                Posts
                    .select('title', 'post_id', 'user_id', 'published_at')
                    .orderBy('published_at', 'desc')
                    .limit(5)
                    .include(Tags)
            )
            .run();

        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(user));
    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

