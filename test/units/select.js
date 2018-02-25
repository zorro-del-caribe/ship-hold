const test = require('zora');
const shiphold = require('../../src/shiphold');

test('bind query to proper table', t => {
	const query = shiphold()
		.model('Users', sh => ({table: 'users', columns: {}, relations: {}}))
		.select()
		.build()
		.text;

	const expected = 'SELECT * FROM "users"';
	t.equal(query, expected);
});

test('bind query to proper table with forwarded arguments', t => {
	const query = shiphold()
		.model('Users', sh => (
			{table: 'users', columns: {}, relations: {}}
		))
		.select('foo', {value: 'bar', as: 'blah'})
		.build()
		.text;

	const expected = 'SELECT "foo", "bar" AS "blah" FROM "users"';
	t.equal(query, expected);
});






