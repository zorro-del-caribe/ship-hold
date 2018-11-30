const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');
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
        sh.stop();
    }
})();

