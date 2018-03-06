const {iterations, breath} = require('../config/bench');
const {Users} = require('./index');
const collectorFactory = require('../collector');
const wait = () => new Promise(resolve => {
	setTimeout(() => resolve(), breath);
});

(async function () {
	let iter = 1;
	const collector = collectorFactory();
	while (iter <= iterations) {
		const start = Date.now();
		const users = await Users
			.fetchAll();
		collector.collect(Date.now() - start);
		await wait();
		iter++;
	}
	collector.print();
})();