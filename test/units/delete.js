const test = require('zora');
const shiphold = require('../../src/shiphold');

test('bind query to proper table', t => {
	const query = shiphold()
		.model('Users', (sh) => ({
			table: 'users', columns: {}, relations: {}
		}))
		.delete()
		.build()
		.text;

	const expected = 'DELETE FROM "users"';
	t.equal(query, expected);
});