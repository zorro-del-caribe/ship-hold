const {iterations, pageSize, breath} = require('../config/bench');
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
		const age = Math.floor(Math.random() * 100);
		const users = await Users
			.query(function (qb) {
				qb
					.where('users.age', '>', age)
					.limit(pageSize)
					.orderBy('name')
			})
			.fetchAll({withRelated: ['products']});
		collector.collect(Date.now() - start);
		await wait();
		iter++;
	}
	collector.print();
})();