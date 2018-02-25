const test = require('zora');
const shiphold = require('../../src/shiphold');

test('bind query to proper table', t => {
	const query = shiphold()
		.model('Users', (sh) => ({table: 'users', columns: {}, relations: {}}))
		.insert()
		.value('foo', 'bar')
		.build()
		.text;

	const expected = 'INSERT INTO "users" ( "foo" ) VALUES ( \'bar\' ) RETURNING *';
	t.equal(query, expected);
});

test('bind query to proper table with forwarded arguments', t => {
	const query = shiphold()
		.model('Users', (sh) => ({table: 'users', columns: {}, relations: {}}))
		.insert({foo: 'bar', woot: 'what'})
		.build()
		.text;

	const expected = 'INSERT INTO "users" ( "foo", "woot" ) VALUES ( \'bar\', \'what\' ) RETURNING *';
	t.equal(query, expected);
});