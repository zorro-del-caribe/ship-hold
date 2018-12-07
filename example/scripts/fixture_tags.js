const casual = require('casual');
const {sh, Posts, Tags, Users} = require('./ship-hold');
const {count: aggCount} = require('ship-hold-querybuilder');
const {TAGS_NUMBER, BATCH_SIZE} = require('../config/tags');

const BATCH_COUNT = TAGS_NUMBER / BATCH_SIZE;

const batchCount = function* () {
    let batch = 1;
    while (batch <= BATCH_COUNT) {
        yield batch;
        batch++;
    }
};

const includeBatchValues = () => {
    const values = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        const row = `('${casual.word}', '${casual.description}')`;
        values.push(row);
    }
    return values.join(', ');
};

async function addTags() {
    for (const b of batchCount()) {
        console.log(`Starting batch ${b}`);
        const query = `INSERT INTO tags(tag, description) VALUES ${includeBatchValues()} ON CONFLICT DO NOTHING`;
        await sh.query(query);
        console.log(`FINISHING batch ${b}`);
    }
}

async function linkTagsToPosts() {
    const tagList = (await Tags.select('tag').run()).map(t => t.tag);
    const [{count: postCount}] = await Posts.select(aggCount('*')).run();
    let i = 1;
    for (i; i <= postCount; i++) {
        const tagsCount = Math.ceil(Math.random() * 5);
        const tagIndexList = [];
        for (let j = 0; j < tagsCount; j++) {
            tagIndexList.push(casual.integer(0, tagList.length - 1));
        }

        if (tagIndexList.length) {
            const q = `INSERT INTO posts_tags (post_id, tag) VALUES ${tagIndexList.map(tagIndex => `(${i},'${tagList[tagIndex]}')`).join(',')} ON CONFLICT DO NOTHING`;
            await sh.query(q);
        }
    }
}

(async function () {
    try {
        await addTags();
        const [{count}] = await Tags.select(aggCount('*')).run();
        console.log(`successfully inserted ${count} tags`);
        await linkTagsToPosts();
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();


