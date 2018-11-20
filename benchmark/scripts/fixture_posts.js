const casual = require('casual');
const {sh, Posts} = require('./ship-hold');
const {count: aggCount} = require('ship-hold-querybuilder');
const {USERS_NUMBER} = require('../config/users');
const {POSTS_NUMBER, BATCH_SIZE} = require('../config/posts');

const BATCH_COUNT = POSTS_NUMBER / BATCH_SIZE;

const batchCount = function* () {
    let batch = 1;
    while (batch <= BATCH_COUNT) {
        yield batch;
        batch++;
    }
};

const wrap = val => `'${val}'`;

const includeBatchValues = () => {
    const values = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        values.push(`(${wrap(casual.title)}, ${wrap(casual.text)}, ${casual.integer(1, USERS_NUMBER)})`);
    }
    return values.join(', ');
};

async function addUsers() {
    for (const b of batchCount()) {
        console.log(`Starting batch ${b}`);
        const query = `
            INSERT INTO posts ("title", "content", "user_id")
            VALUES 
            ${includeBatchValues()} 
            ON CONFLICT DO NOTHING;
        `;
        await sh.query(query);
        console.log(`FINISHING batch ${b}`);
    }
}

(async function () {
    try {
        await addUsers();
        const [{count}] = await Posts.select(aggCount('*')).run();
        console.log(`successfully inserted ${count} posts`);
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();


