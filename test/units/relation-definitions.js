const test = require('zora');
const {default:rel} = require('../../src/lib/relation-definitions');

test('belongsTo', t => {
	const relation = rel.belongsTo('Users', 'userId');
	t.deepEqual(relation, {
		foreignKey: 'userId',
		relation: 'belongsTo', model: 'Users',
		asCollection: false
	});
});

test('belongsTo: throw if no foreign key is provided', t => {
	try {
		const relation = rel.belongsTo('Users');
		t.fail('should not get here');
	} catch (e) {
		t.equal(e.message, 'when using the relation "belongsTo", you must specify a foreignKey');
	}
});

test('hasMany', t => {
	const relation = rel.hasMany('Products');
	t.deepEqual(relation, {
		relation: 'hasMany',
		model: 'Products',
		asCollection: true
	});
});

test('hasOne', t => {
	const relation = rel.hasOne('Phones');
	t.deepEqual(relation, {
		relation: 'hasOne',
		model: 'Phones',
		asCollection: false
	});
});

test('belongsToMany', t => {
	const relation = rel.belongsToMany('Users', 'UsersAccounts', 'accountId');
	t.deepEqual(relation, {
		through: 'UsersAccounts',
		referenceKey: 'accountId',
		relation: 'belongsToMany',
		model: 'Users',
		asCollection: true
	});
});

test('belongsToMany: throw error if there is no through model', t => {
	try {
		const relation = rel.belongsToMany('Users');
		t.fail('should not get here');
	} catch (e) {
		t.equal(e.message, 'when using the relation "belongsToMany", you must specify a through model')
	}
});