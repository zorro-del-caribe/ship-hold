const {count} = require('ship-hold-querybuilder');
const {parallels} = require('./util');

module.exports = function (sh, test) {
    const createService = () => sh.service({
        table: 'users_delete',
        name: 'Users'
    });

    return test('delete', parallels(async t => {
        await t.test('add fixture', async t => {
            const {query} = sh;
            const result = await query(`INSERT INTO users_delete(name, age) 
      VALUES 
      ('Laurent',29),
      ('Jesus', 2016),
      ('Raymond',55),
      ('Blandine',29),
      ('Olivier',31),
      ('Francoise',58)
      RETURNING *`);

            t.equal(result.rows.length, 6);
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

            t.deepEqual(+remaining.count, 3);
        });

        await t.test('delete without service', async t => {
            const Users = createService();

            const [remainingBefore] = await Users
                .select(count('*'))
                .where('name', 'Laurent')
                .run();

            t.equal(+(remainingBefore.count), 1, 'should have one Laurent before');

            await sh
                .delete('users_delete')
                .where('name', '$name')
                .run({name: 'Laurent'});

            const [remainingAfter] = await Users
                .select(count('*'))
                .where('name', 'Laurent')
                .run();

            t.equal(+(remainingAfter.count), 0, 'should not have any Laurent after');
        });
    }));
};

