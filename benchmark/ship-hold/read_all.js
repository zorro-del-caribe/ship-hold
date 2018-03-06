const {iterations, breath} = require('../config/bench');
const {Users} = require('../scripts/ship-hold');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
	setTimeout(() => resolve(), breath);
});

(async function () {
	let iter = 1;
	const collector = collectorFactory();
	while (iter <= iterations) {
		const start = Date.now();
		await new Promise(resolve => Users
			.select()
			.stream({}, function * () {
				try {
					while (true) {
						const r = yield;
					}
				} catch (e) {
					console.log(e);
					process.exit(1);
				} finally {
					collector.collect(Date.now() - start);
					resolve();
				}
			}));
		await wait();
		iter++;
	}
	collector.print();
})();

