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
        const user = await Users
            .findOne({
                where: {
                    user_id: 38778
                },
                include: [
                        {
                        model: Comments,
                        order: [['published_at', 'desc']],
                        limit: 5,
                        include: [
                            {
                                model: Posts, attributes: ['post_id', 'user_id', 'title'],
                                include: [{model: Users, attributes: ['user_id', 'first_name', 'last_name']}]
                            }
                        ]
                    },
                    {
                        model: Posts,
                        attributes: ['title', 'post_id', 'user_id', 'published_at'],
                        order: [['published_at', 'desc']],
                        limit: 5,
                        include:Tags
                    }]
            });
        console.log(`executed in ${Date.now() - start}ms`);
        console.log(JSON.stringify(user));

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
