const test = require('zora');
const {aggregate} = require('ship-hold-querybuilder');


module.exports = function (sh) {
	const createModels = () => sh.model('Users', h => ({
		table: 'users_delete',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string'
		}
	}));

	return test('delete', async t => {
		await t.test('add fixture', async t => {
			const {query} = sh;
			const result = await query(`INSERT INTO users_delete(name, age) 
      VALUES 
      ('Laurent',29),
      ('Jesus', 2016),
      ('Raymond',55),
      ('Blandine',29),
      ('Olivier',31),
      ('Francoise',58)
      RETURNING *`);

			t.equal(result.rows.length, 6);
		});

		await t.test('delete a bunch of users', async t => {
			const Users = createModels();
			const [users] = await Users
				.delete()
				.where('age', '>', '$age')
				.run({age: 50});

			const [remaining] = await Users
				.select(aggregate.count('*'))
				.run();

			t.deepEqual(remaining, {count: 3});
		});

		await t.test('delete without model', async t => {
			const Users = createModels();

			const [remainingBefore] = await Users
				.select(aggregate.count('*'))
				.where('name', 'Laurent')
				.run();

			t.equal(+(remainingBefore.count), 1, 'should have one Laurent before');

			await sh
				.delete('users_delete')
				.where('name', '$name')
				.run({name: 'Laurent'});

			const [remainingAfter] = await Users
				.select(aggregate.count('*'))
				.where('name', 'Laurent')
				.run();

			t.equal(+(remainingAfter.count), 0, 'should not have any Laurent after');
		});
	});
};

