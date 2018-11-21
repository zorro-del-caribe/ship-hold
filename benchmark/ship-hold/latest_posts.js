const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Posts, Comments} = require('../scripts/ship-hold');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

(async function () {
    let iter = 1;
    const collector = collectorFactory();
    while (iter <= iterations) {
        const start = Date.now();
        const posts = await Posts
            .select()
            .orderBy('published_at')
            .limit(pageSize)
            .include(
                // Users,
                Comments
                    .select()
                    .orderBy('published_at')
                    .limit(10)
                    .include(Users)
            )
            .debug();

        const executionTime = Date.now() - start;
        collector.collect(executionTime);
        console.log(JSON.stringify(posts[0]))
        console.log(`executed in ${executionTime}ms`);
        await wait();
        iter++;
    }
    collector.print();
})();

