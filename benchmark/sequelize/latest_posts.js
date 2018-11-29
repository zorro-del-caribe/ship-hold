const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Tags, Posts, Comments} = require('./models');
const Sequelize = require('sequelize');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

(async function () {
    try {
        let iter = 1;
        // const collector = collectorFactory();
        // while (iter <= iterations) {
        const start = Date.now();
        const posts = await Posts
            .findAll({
                include: [Users, {
                    model: Comments,
                    order: [['published_at', 'desc']],
                    limit: 3,
                    include: [Users]
                }, {model: Tags, attributes: ['tag']}],
                limit: pageSize,
                order: [['published_at', 'desc']]
            });
        console.log(`executed in ${Date.now() - start}ms`);
        console.log(JSON.stringify(posts));

        // collector.collect(Date.now() - start);
        await wait();
        iter++;
        // }
        // collector.print();
    } catch (e) {
        console.log(e);
    } finally {
        process.exit(0);
    }
})();
