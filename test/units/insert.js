const test = require('zora');
const {shiphold} = require('../../dist/bundle');

const createService = () => shiphold()
    .service({name: 'Users', table: 'users', primaryKey: 'id'});

test('bind query to proper table', t => {
    const query = createService()
        .insert('foo')
        .values({foo: 'bar'})
        .build()
        .text;

    const expected = 'INSERT INTO "users" ( "foo" ) VALUES ( \'bar\' ) RETURNING *';
    t.equal(query, expected);
});

test('bind query to proper table with forwarded arguments', t => {
    const query = createService()
        .insert({foo: 'bar', woot: 'what'})
        .build()
        .text;

    const expected = 'INSERT INTO "users" ( "foo", "woot" ) VALUES ( \'bar\', \'what\' ) RETURNING *';
    t.equal(query, expected);
});
