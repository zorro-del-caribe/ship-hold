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
        const tag = await Tags
            .findAll({
                include: [{
                    model:Posts,
                    // include:[Users]
                }],
                orderBy:[['tag','desc']],
                limit:2
            });
        console.log(`executed in ${Date.now() - start}ms`);
        console.log(JSON.stringify(tag));

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
