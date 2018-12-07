const casual = require('casual');
const {sh, Users} = require('./ship-hold');
const {count: aggCount} = require('ship-hold-querybuilder');
const {BATCH_SIZE, USERS_NUMBER} = require('../config/users');

const BATCH_COUNT = USERS_NUMBER / BATCH_SIZE;

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
        values.push(`(${wrap(casual.email)}, ${wrap(casual.sentences(5))}, ${wrap(casual.first_name)}, ${wrap(casual.last_name)})`);
    }
    return values.join(', ');
};

async function addUsers() {
    for (const b of batchCount()) {
        console.log(`Starting batch ${b}`);
        const query = `
            INSERT INTO users ("email", "biography", "first_name", "last_name")
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
        const [{count}] = await Users.select(aggCount('*')).run();
        console.log(`successfully inserted ${count} users`);
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();


