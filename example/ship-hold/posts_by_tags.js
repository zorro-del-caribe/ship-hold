const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');

(async function () {
    try {
        const start = Date.now();
        const [tag] = await Tags
            .select()
            .where('tag', 'nisi')
            .include(
                Posts
                    .select()
                    .orderBy('published_at', 'desc')
                    .limit(5)
                    .include(
                        Users,
                        Comments
                            .select()
                            .orderBy('published_at', 'desc')
                            .limit(3)
                    )
            )
            .run();

        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        // console.log(JSON.stringify(tag));
    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

