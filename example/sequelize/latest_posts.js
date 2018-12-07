const {pageSize} = require('../config/example');
const {Users, Tags, Posts, Comments} = require('./models');

(async function () {
    try {
        const start = Date.now();
        const posts = await Posts
            .findAll({
                include: [Users, {
                    model: Comments,
                    order: [['published_at', 'desc']],
                    limit: 3,
                    include: [Users]
                }, {model: Tags, attributes: ['tag']}],
                limit: 5,
                order: [['published_at', 'desc']]
            });
        console.log(`executed in ${Date.now() - start}ms`);
        // console.log(JSON.stringify(posts));
    } catch (e) {
        console.log(e);
    } finally {
        process.exit(0);
    }
})();
