const test = require('zora');
const {default:registryFactory} = require('../../src-old/lib/model-registry');

test('should create a model service when a definition argument is passed', t => {
	const registry = registryFactory({});

	const model = registry.model('foo', () => ({
		table: 'users',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string'
		}
	}));

	t.equal(typeof model.select, 'function', 'select method should be defined');
	t.equal(typeof model.insert, 'function', 'insert method should be defined');
	t.equal(typeof model.delete, 'function', 'delete method should be defined');
	t.equal(typeof model.update, 'function', 'update method should be defined');
	t.equal(typeof model.if, 'function', 'if method should be defined');
});

test('services should be singletons', t => {
	const registry = registryFactory({});

	const model = registry.model('foo', () => ({
		table: 'users',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string'
		}
	}));

	t.equal(model, registry.model('foo'), 'should refer to the same reference');
});

test('registry should be iterable', t => {
	const registry = registryFactory({});

	const model = registry.model('foo', () => ({
		table: 'users',
		columns: {
			id: 'integer',
			age: 'integer',
			name: 'string'
		}
	}));

	t.equal(typeof registry[Symbol.iterator],'function');
	const items = [...registry];
	t.deepEqual(items,[['foo',model]]);
});
