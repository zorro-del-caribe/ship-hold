const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Products} = require('../scripts/ship-hold');
const collectorFactory = require('../collector');


const wait = () => new Promise(resolve => {
	setTimeout(() => resolve(), breath);
});

(async function () {
	let iter = 1;
	const collector = collectorFactory();
	while (iter <= iterations) {
		const age = Math.floor(Math.random() * 100);
		const start = Date.now();
		await new Promise(resolve => Users
			.select()
			.where('age', '>', age)
			.orderBy('name')
			.limit(pageSize)
			.include(Products)
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

