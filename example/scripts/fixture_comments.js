const casual = require('casual');
const {sh, Posts, Comments, Users} = require('./ship-hold');
const {count: aggCount} = require('ship-hold-querybuilder');
const {COMMENTS_NUMBER, BATCH_SIZE} = require('../config/comments');

const BATCH_COUNT = COMMENTS_NUMBER / BATCH_SIZE;

const batchCount = function* () {
    let batch = 1;
    while (batch <= BATCH_COUNT) {
        yield batch;
        batch++;
    }
};

const includeBatchValues = (usersCount, postsCount) => {
    const values = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        values.push({
            content: casual.sentences(3),
            published_at: casual.date('YYYY-MM-DD'),
            user_id: casual.integer(1, usersCount),
            post_id: casual.integer(1, postsCount),
        });
    }
    return values;
};

async function addComments() {
    const [{count: usersCount}] = await Users.select(aggCount('*')).run();
    const [{count: postsCount}] = await Posts.select(aggCount('*')).run();
    for (const b of batchCount()) {
        console.log(`Starting batch ${b}`);
        await Comments.insert('content', 'published_at', 'user_id', 'post_id')
            .values(
                includeBatchValues(usersCount, postsCount)
            )
            .run();
        console.log(`FINISHING batch ${b}`);
    }
}

(async function () {
    try {
        await addComments();
        const [{count}] = await Comments.select(aggCount('*')).run();
        console.log(`successfully inserted ${count} comments`);
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();


