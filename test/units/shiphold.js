const shiphold = require('../../src/shiphold');
const test = require('zora');

test('service registry', t => {
	const sh = shiphold();
	const Users = sh.model('Users', sh => ({table: 'users', columns: {}}));
	const Users2 = sh.model('Users');
	t.equal(Users, Users2, 'services should be singletons');
});

test('create only a service registry per instance (not shared', t => {
	const sh1 = shiphold();
	sh1.model('foo', () => ({
		table: 'foo',
		columns: {}
	}));
	const sh2 = shiphold();
	sh2.model('bar', () => ({
		table: 'bar',
		columns: {}
	}));
	t.equal([...sh1].length, 1);
});