const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Posts} = require('./index');
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
            .query(function (qb) {
                qb
                    .limit(pageSize)
                    .orderBy('published_at');
            })
            .fetchAll({withRelated: ['author', 'comments']});
        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        collector.collect(executionTime);
        await wait();
        iter++;
    }
    collector.print();
})();
