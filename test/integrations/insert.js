const {wrapWithShipHold} = require('../util.js');

export default wrapWithShipHold(async function ({test}, sh) {

    const createService = () => sh.service({
        table: 'users_insert',
        name: 'Users'
    });

    await test(`create schema`, async t => {
        await sh.query(`
        DROP TABLE if EXISTS users_insert;
        CREATE TABLE users_insert(
            id serial PRIMARY KEY,
            age integer,
            name varchar(100)
        );`);
        t.ok(true, 'schema created');
    });

    await test('add a user and return it', async t => {
        const [user] = await createService()
            .insert({age: '$age', name: '$name'})
            .run({age: 29, name: 'Laurent'});

        t.eq(user, {id: 1, name: 'Laurent', age: 29});
    });

    return Promise.all([
        test('add a user with the field declaration notation', async t => {
            const [user] = await createService()
                .insert('age', 'name')
                .values({age: '$age', name: '$name'})
                .run({age: 29, name: 'Blandine'});

            t.eq(user, {id: 2, name: 'Blandine', age: 29});
        }),
        test('add user with no service', async t => {
            const [user] = await sh
                .insert({age: 666, name: 'devil'})
                .into('users_insert')
                .returning('*')
                .run();
            t.eq(user, {id: 3, name: 'devil', age: 666});
        })
    ]);
});

