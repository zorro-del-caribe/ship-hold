const test = require('zora');
const {default:shiphold} = require('../../src/shiphold');

test('bind query to proper table', t => {
	const query = shiphold()
		.model('Users', sh => ({table: 'users', columns: {}, relations: {}}))
		.update()
		.set('foo', 'bar')
		.build()
		.text;

	const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
	t.equal(query, expected);
});

test('bind query to proper table using object map has parameters', t => {
	const query = shiphold()
		.model('Users', sh => ({table: 'users', columns: {}, relations: {}}))
		.update({foo: 'bar'})
		.build()
		.text;

	const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
	t.equal(query, expected);
});