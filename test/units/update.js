const test = require('zora');
const {shiphold} = require('../../dist/bundle');

const createService = () => shiphold()
    .service({name: 'Users', table: 'users', primaryKey: 'id'});

test('bind query to proper table', t => {
    const query = createService()
        .update()
        .set('foo', 'bar')
        .build()
        .text;

    const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
    t.equal(query, expected);
});

test('bind query to proper table using object map has parameters', t => {
    const query = createService()
        .update({foo: 'bar'})
        .build()
        .text;

    const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
    t.equal(query, expected);
});
