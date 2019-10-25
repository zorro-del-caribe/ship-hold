const {shiphold} = require('../dist/bundle/index.js');

exports.wrapWithShipHold = fn => async function (t) {
    const sh = shiphold({
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        user: process.env.POSTGRES_USER || 'docker',
        password: process.env.POSTGRES_PASSWORD || 'docker',
        database: process.env.POSTGRES_DB || 'ship-hold-test'
    });

    try {
        await fn(t, sh);
    } catch (e) {
        console.error(e);
        process.exit(1);
        throw e;
    } finally {
        sh.stop();
    }

};
