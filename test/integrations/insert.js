const test = require('zora');

module.exports = function (sh) {
	const createModels = () => sh.model('Users', h => ({
		table: 'users_insert',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string'
		}
	}));

	return test('insert', async t => {
		await t.test('add a user and return it', async t => {
			const [user] = await createModels()
				.insert({age: '$age', name: '$name'})
				.run({age: 29, name: 'Laurent'});

			t.deepEqual(user, {id: 1, name: 'Laurent', age: 29});
		});

		await t.test('add a user with the values notation', async t => {
			const [user] = await createModels()
				.insert()
				.value('age', '$age')
				.value('name', '$name')
				.run({age: 29, name: 'Blandine'});

			t.deepEqual(user, {id: 2, name: 'Blandine', age: 29});
		});
	});
};

