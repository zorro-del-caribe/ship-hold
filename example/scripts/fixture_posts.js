const casual = require('casual');
const {sh, Posts, Users} = require('./ship-hold');
const {count: aggCount} = require('ship-hold-querybuilder');
const {POSTS_NUMBER, BATCH_SIZE} = require('../config/posts');

const BATCH_COUNT = POSTS_NUMBER / BATCH_SIZE;

const batchCount = function* () {
    let batch = 1;
    while (batch <= BATCH_COUNT) {
        yield batch;
        batch++;
    }
};

const includeBatchValues = (usercount) => {
    const values = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        values.push({
            title: casual.title,
            content: casual.text,
            published_at: casual.date('YYYY-MM-DD'),
            user_id: casual.integer(1, usercount)
        });
    }
    return values;
};

async function addPosts() {

    const [{count: usersCount}] = await Users.select(aggCount('*')).run();

    for (const b of batchCount()) {
        console.log(`Starting batch ${b}`);
        await sh.insert('title', 'content', 'published_at', 'user_id')
            .values(
                includeBatchValues(usersCount)
            )
            .into('posts')
            .run();

        console.log(`FINISHING batch ${b}`);
    }
}

(async function () {
    try {
        await addPosts();
        const [{count}] = await Posts.select(aggCount('*')).run();
        console.log(`successfully inserted ${count} posts`);
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();


