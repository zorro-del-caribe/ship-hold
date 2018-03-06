const casual = require('casual');
const {sh, Users} = require('./ship-hold');
const {aggregate} = require('ship-hold-querybuilder');

const batch = function * (limit = 10000) {
	let i = 0;
	while (i < limit) {
		yield i;
		i++
	}
};

async function addUsers() {
	let done = 0;
	while (done < 10) {
		console.log(`starting batch ${done + 1}`);
		await Promise.all([...batch()].map(() => {
			const date = (new Date(casual.unix_time * 1000)).toISOString();
			return Users
				.insert({
					age: casual.integer(from = 1, to = 100),
					name: casual.name,
					email: casual.email,
					username: casual.username,
					country: casual.country_code,
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
		await addUsers();
		const [{count}] =await Users.select(aggregate.count('*')).run();
		console.log(`successfully inserted ${count} users`);
	} catch (e) {
		console.log(e);
		process.exit(1);
	} finally {
		sh.stop();
	}
})();


