const {shiphold} = require('../../dist/bundle');

export default ({test}) => {
    test('builder factory should return builders', t => {
        const builders = shiphold({});
        t.eq(typeof builders.select, 'function', 'select should be a function');
        t.eq(typeof builders.insert, 'function', 'insert should be a function');
        t.eq(typeof builders.delete, 'function', 'delete should be a function');
        t.eq(typeof builders.update, 'function', 'update should be a function');
        t.eq(typeof builders.if, 'function', 'if should be a function');
    });

    test('all CRUD builders should be extended with a runner function', t => {
        const builders = shiphold({});
        t.eq(typeof builders.select().run, 'function', 'select builder should have a run method');
        t.eq(typeof builders.insert({}).run, 'function', 'insert builder should have a run method');
        t.eq(typeof builders.delete().run, 'function', 'delete builder should have a run method');
        t.eq(typeof builders.update('table').run, 'function', 'update builder should have a run method');
    });
}
