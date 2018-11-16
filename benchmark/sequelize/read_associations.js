const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Products} = require('./index');
const Sequelize = require('sequelize');
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
			.findAll({
				include: [Products],
				where: {
					age: {[Sequelize.Op.gt]: age}
				},
				limit: pageSize,
				order: ['name']
			});
		collector.collect(Date.now() - start);
		await wait();
		iter++;
	}
	collector.print();
})();
