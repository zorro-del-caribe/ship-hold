const {Users, Posts, Tags, PostsTags, Comments, sh} = require('../scripts/ship-hold');
const {sum} = require('ship-hold-querybuilder');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

(async function () {
    try {
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
                        Users,
                        Comments
                            .select()
                            .orderBy('published_at', 'desc')
                            .limit(3)
                    )
            )
            .debug();

        const executionTime = Date.now() - start;
        console.log(`executed in ${executionTime}ms`);
        // console.log(JSON.stringify(tag));
    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

