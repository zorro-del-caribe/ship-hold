const {Users, Tags, Posts, Comments} = require('./models');

(async function () {
    try {
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
                        include: Tags
                    }]
            });
        console.log(`executed in ${Date.now() - start}ms`);
        // console.log(JSON.stringify(user));
    } catch (e) {
        console.log(e);
    } finally {
        process.exit(0);
    }
})();
