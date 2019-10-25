const {shiphold} = require('../../dist/bundle');

const createService = () => shiphold()
    .service({name: 'Users', table: 'users', primaryKey: 'id'});

export default ({test}) => {

    test('bind query to proper table', t => {
        const query = createService()
            .select()
            .build()
            .text;

        const expected = 'SELECT * FROM "users"';
        t.eq(query, expected);
    });

    test('bind query to proper table with forwarded arguments', t => {
        const query = createService()
            .select('foo', {value: 'bar', as: 'blah'})
            .build()
            .text;

        const expected = 'SELECT "foo", "bar" AS "blah" FROM "users"';
        t.eq(query, expected);
    });
};
