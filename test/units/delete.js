const {shiphold} = require('../../dist/bundle');

export default ({test}) => {
    test('bind query to proper table', t => {
        const query = shiphold()
            .service({name: 'Users', table: 'users', primaryKey: 'id'})
            .delete()
            .build()
            .text;

        const expected = 'DELETE FROM "users"';
        t.eq(query, expected);
    });
};
