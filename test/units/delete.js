const test = require('zora');
const {shiphold} = require('../../dist/bundle');

test('bind query to proper table', t => {
    const query = shiphold()
        .service({name: 'Users', table: 'users', primaryKey: 'id'})
        .delete()
        .build()
        .text;

    const expected = 'DELETE FROM "users"';
    t.equal(query, expected);
});
