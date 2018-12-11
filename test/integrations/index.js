const {shiphold} = require('../../dist/bundle');
const setup = require('./setup');
const shInstance = shiphold({
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    user: process.env.POSTGRES_USER || 'docker',
    password: process.env.POSTGRES_PASSWORD || 'docker',
    database: process.env.POSTGRES_DB || 'ship-hold-test'
});
const test = require('zora');

const testFiles = [
    './delete.js',
    './insert.js',
    './select_simple.js',
    './select_associations.js',
    './update.js'
];

(async function () {
    let sh;
    try {
        test('integration tests', async t => {
            await t.test('setup database', async t => {
                sh = await setup(shInstance);
                t.ok(sh, 'should have set up the database');
            });

            await t.test('test suites', async t => {
                await Promise.all(testFiles.map(tf => require(tf)(sh, t.test)));
            });

            t.test('clean', async t => {
                await sh.stop();
                t.ok(true, 'should have cleaned the database');
            });
        });
    }
    catch (e) {
        console.log(e);
        process.exit(1);
    }
})();
