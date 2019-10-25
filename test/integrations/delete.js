const {count} = require('ship-hold-querybuilder');
const {wrapWithShipHold} = require('../util.js');

export default wrapWithShipHold(async function (t, sh) {

    const createService = () => sh.service({
        table: 'users_delete',
        name: 'Users'
    });

    await t.test('add fixture', async t => {
        const {query} = sh;
        await query(`
            DROP TABLE IF EXISTS users_delete;
            CREATE TABLE users_delete (
                id serial PRIMARY KEY,
                age integer,
                name varchar(100)
            );
            INSERT INTO users_delete(name, age) 
            VALUES 
              ('Laurent',29),
              ('Jesus', 2016),
              ('Raymond',55),
              ('Blandine',29),
              ('Olivier',31),
              ('Francoise',58)
            RETURNING *;`);

        const {rows} = await query(`select count(*) from users_delete`);
        t.eq(+rows[0].count, 6);
    });

    await t.test('delete a bunch of users', async t => {
        const Users = createService();
        const [users] = await Users
            .delete()
            .where('age', '>', '$age')
            .run({age: 50});

        const [remaining] = await Users
            .select(count('*'))
            .run();

        t.eq(+remaining.count, 3);
    });

    await t.test('delete without service', async t => {
        const Users = createService();

        const [remainingBefore] = await Users
            .select(count('*'))
            .where('name', 'Laurent')
            .run();

        t.eq(+(remainingBefore.count), 1, 'should have one Laurent before');

        await sh
            .delete('users_delete')
            .where('name', '$name')
            .run({name: 'Laurent'});

        const [remainingAfter] = await Users
            .select(count('*'))
            .where('name', 'Laurent')
            .run();

        t.eq(+(remainingAfter.count), 0, 'should not have any Laurent after');
    });
});

