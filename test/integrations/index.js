const shiphold = require('../../src/shiphold');
const setup = require('./setup');
const sh = shiphold({
	host: process.env.DB_HOSTNAME || '127.0.0.1',
	user: process.env.DB_USERNAME || 'docker',
	password: process.env.DB_PASSWORD || 'docker',
	database: process.env.DB_NAME || 'ship-hold-test'
});

(async function () {
	try {
		await setup(sh);
		const tests = [
			// './select_simple',
			// './insert',
			// './update',
			'./select_associations'
		].map(f => (require(f)(sh)).task);

		// wait for tests to complete
		for (const t of tests) {
			await t;
		}
	}
	finally {
		setTimeout(()=>sh.stop(),100);
	}
})();