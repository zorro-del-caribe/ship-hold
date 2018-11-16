const casual = require('casual');
const {sh, Products, Users} = require('./ship-hold');
const {count:aggCount} = require('ship-hold-querybuilder');

const batch = function * (limit = 10000) {
	let i = 0;
	while (i < limit) {
		yield i;
		i++
	}
};

async function addProduct() {
	let done = 0;
	while (done < 30) {
		console.log(`starting batch ${done + 1}`);
		await Promise.all([...batch()].map(() => {
			const date = (new Date(casual.unix_time * 1000)).toISOString();
			return Products
				.insert({
					price: casual.double(from = 1, to = 100),
					title: casual.title,
					user_id: casual.integer(from = 1, to = 100000),
					sku: casual.word,
					stock: casual.integer(from = 0, to = 2000),
					created_at: date,
					updated_at: date
				})
				.run();
		}));
		done++;
		console.log(`batch ${done} done`);
	}
}

(async function () {
	try {
		await addProduct();
		const [{count}] = await Products.select(aggCount('*')).run();
		console.log(`successfully inserted ${count} products`);
	} catch (e) {
		console.log(e);
		process.exit(1);
	} finally {
		sh.stop();
	}
})();
