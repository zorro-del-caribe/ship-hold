const {parallels} = require('./util');

module.exports = function (sh, test) {
    const createService = () => sh.service({
        table: 'users_insert',
        name: 'Users'
    });

    return test('insert', parallels(async t => {
        await t.test('add a user and return it', async t => {
            const [user] = await createService()
                .insert({age: '$age', name: '$name'})
                .run({age: 29, name: 'Laurent'});

            t.deepEqual(user, {id: 1, name: 'Laurent', age: 29});
        });

        await t.test('add a user with the field declaration notation', async t => {
            const [user] = await createService()
                .insert('age', 'name')
                .values({age: '$age', name: '$name'})
                .run({age: 29, name: 'Blandine'});

            t.deepEqual(user, {id: 2, name: 'Blandine', age: 29});
        });

        await t.test('add user with no service', async t => {
            const [user] = await sh
                .insert({age: 666, name: 'devil'})
                .into('users_insert')
                .returning('*')
                .run();
            t.deepEqual(user, {id: 3, name: 'devil', age: 666});
        });
    }));
};

