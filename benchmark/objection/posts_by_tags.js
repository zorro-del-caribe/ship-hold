const {iterations, pageSize, breath} = require('../config/bench');
const {User, knex, Tag, Post} = require('./models');
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
        const posts = await Tag
            .query()
            .orderBy('tag')
            .limit(5)
            .eager('[posts]');


        // Not possible to have it right: https://github.com/Vincit/objection.js/issues/848

        const executionTime = Date.now() - start;
        // collector.collect(executionTime);
        console.log(`executed in ${executionTime}ms`);
        console.log(JSON.stringify(posts));
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
