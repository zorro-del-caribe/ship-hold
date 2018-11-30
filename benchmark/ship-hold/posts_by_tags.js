const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Posts, Tags, PostsTags, Comments, sh} = require('../scripts/ship-hold');
const {sum} = require('ship-hold-querybuilder');
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

        const [tag] = await Tags
            .select()
            .where('tag', 'nisi')
            .include(
                Posts
                    .select()
                    .orderBy('published_at', 'desc')
                    .limit(5)
                    .include(
                        Users
                        // Comments
                        //     .select()
                        //     .orderBy('published_at', 'desc')
                        //     .limit(3)
                        //     .include(Users)
                    )
            )
            .debug();

        const executionTime = Date.now() - start;
        // collector.collect(executionTime);
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(tag));
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

