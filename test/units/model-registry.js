const test = require('zora');
const {shiphold} = require('../../dist/bundle');

test('should create a service when a definition argument is passed', t => {
    const registry = shiphold({});

    const service = registry.service({table: 'users'});

    t.equal(typeof service.select, 'function', 'select method should be defined');
    t.equal(typeof service.insert, 'function', 'insert method should be defined');
    t.equal(typeof service.delete, 'function', 'delete method should be defined');
    t.equal(typeof service.update, 'function', 'update method should be defined');
    t.equal(typeof service.if, 'function', 'if method should be defined');
});

test('services should be singletons', t => {
    const registry = shiphold({});
    const service = registry.service({name: 'foo', table: 'users'});
    t.equal(service, registry.service('foo'), 'should refer to the same reference');
});

test('registry should be iterable', t => {
    const registry = shiphold({});

    const service = registry.service({
        table: 'users',
        name: 'foo'
    });

    t.equal(typeof registry[Symbol.iterator], 'function');
    const items = [...registry];
    t.deepEqual(items, [['foo', service]]);
});
