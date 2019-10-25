const {shiphold} = require('../../dist/bundle');

export default ({test}) => {

    test('should create a service when a definition argument is passed', t => {
        const registry = shiphold({});

        const service = registry.service({table: 'users'});

        t.eq(typeof service.select, 'function', 'select method should be defined');
        t.eq(typeof service.insert, 'function', 'insert method should be defined');
        t.eq(typeof service.delete, 'function', 'delete method should be defined');
        t.eq(typeof service.update, 'function', 'update method should be defined');
        t.eq(typeof service.if, 'function', 'if method should be defined');
    });

    test('services should be singletons', t => {
        const registry = shiphold({});
        const service = registry.service({name: 'foo', table: 'users'});
        t.eq(service, registry.service('foo'), 'should refer to the same reference');
    });

    test('should pass default value', t => {
        const registry = shiphold({});
        const service = registry.service({table: 'users'});
        t.eq(service.definition.primaryKey, 'id', 'default primaryKey should be "id"');
        t.eq(service.definition.name, 'Users', 'default name should be a camel case version of the table name');
    });

    test('registry should be iterable', t => {
        const registry = shiphold({});

        const service = registry.service({
            table: 'users',
            name: 'foo'
        });

        t.eq(typeof registry[Symbol.iterator], 'function');
        const items = [...registry];
        t.eq(items, [['foo', service]]);
    });
}