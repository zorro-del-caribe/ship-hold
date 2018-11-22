const {shiphold} = require('../../dist/bundle');
const setup = require('./setup');
const sh = shiphold({
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    user: process.env.POSTGRES_USER || 'docker',
    password: process.env.POSTGRES_PASSWORD || 'docker',
    database: process.env.POSTGRES_DB || 'ship-hold-test'
});

(async function () {
    try {
        await setup(sh);
        const tests = [
            // './select_simple',
            './select_associations',
            // './insert',
            // './update',
            // './delete'
        ].map(f => (require(f)(sh)).task);

        // wait for tests to complete (//todo could be run in parallel ? )
        for (const t of tests) {
            await t;
        }
    }
    finally {
        setTimeout(() => sh.stop(), 100);
    }
})();
