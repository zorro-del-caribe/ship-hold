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
		const users = await Users
			.select()
			.where('age', '>', age)
			.orderBy('name')
			.limit(pageSize)
			.include(Products)
			.run();
		collector.collect(Date.now() - start);
		await wait();
		iter++;
	}
	collector.print();
})();

