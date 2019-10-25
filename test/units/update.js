const {shiphold} = require('../../dist/bundle');

const createService = () => shiphold()
    .service({name: 'Users', table: 'users', primaryKey: 'id'});

export default ({test}) => {

    test('bind query to proper table', t => {
        const query = createService()
            .update()
            .set('foo', 'bar')
            .build()
            .text;

        const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
        t.eq(query, expected);
    });

    test('bind query to proper table using object map has parameters', t => {
        const query = createService()
            .update({foo: 'bar'})
            .build()
            .text;

        const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
        t.eq(query, expected);
    });
};