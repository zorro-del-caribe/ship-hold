const {parallels} = require('./util');

module.exports = function (sh, test) {
    let fixtures;
    const fixtureFactory = items => (filterFunc = x => true) => items.map(i => Object.assign({}, i)).filter(filterFunc);

    const createService = () => sh.service({
        table: 'users_simple_select',
        name: 'Users'
    });

    return test('select_simple', parallels(async t => {
        await t.test('add fixture', async t => {
            const {query} = sh;
            const result = await query(`INSERT INTO users_simple_select(name, age) 
      VALUES 
      ('Laurent',29),
      ('Jesus', 2016),
      ('Raymond',55),
      ('Blandine',29),
      ('Olivier',31),
      ('Francoise',58)
      RETURNING *`);

            fixtures = fixtureFactory(result.rows);
            t.equal(result.rows.length, 6);
        });

        t.test('select all without service', async t => {
            const users = await sh
                .select()
                .from('users_simple_select')
                .orderBy('id')
                .run();

            t.deepEqual(users, fixtures());
        });

        t.test('select all', async t => {
            const users = await createService()
                .select()
                .orderBy('id')
                .run();

            t.deepEqual(users, fixtures());
        });


        t.test('select specified fields', async t => {
            const users = await createService()
                .select('name', 'age', 'id')
                .orderBy('id')
                .run();

            t.deepEqual(users, fixtures().map(({id, name, age}) => ({id, name, age})));
        });

        t.test('support simple where clause', async t => {
            const users = await createService()
                .select()
                .where('id', 3)
                .run();

            t.deepEqual(users, fixtures(x => x.id === 3));
        });

        t.test('support parameters in where clause', async t => {
            const users = await createService()
                .select()
                .where('id', '$id')
                .run({id: 4});

            t.deepEqual(users, fixtures(x => x.id === 4));
        });

        t.test('support complex query', async t => {
            const users = await createService()
                .select()
                .where('age', '>', 20)
                .and('name', 'Laurent')
                .run();

            t.deepEqual(users, fixtures(x => x.age > 20 && x.name === 'Laurent'));
        });

        t.test('support complex query with parameters', async t => {
            const users = await createService()
                .select()
                .where('age', '<', '$age')
                .and('name', '$name')
                .run({age: 50, name: 'Blandine'});

            t.deepEqual(users, fixtures().filter(x => x.age < 50 && x.name === 'Blandine'));
        });

        t.test('support sub query', async t => {
            const service = createService();
            const subq = service.if('name', '>', 'J').and('age', '>', 30);

            const users = await service
                .select()
                .where('name', 'Blandine')
                .or(subq)
                .run();

            t.deepEqual(users, fixtures(f => f.name === 'Blandine' || (f.name > 'J' && f.age > 30)));
        });

        t.test('support sub query with parameters', async t => {
            const service = createService();
            const subq = service.if('name', '>', '$name').and('age', '>', '$age');

            const users = await service
                .select()
                .where('name', '$fixName')
                .or(subq)
                .run({fixName: 'Blandine', name: 'J', age: 30});

            t.deepEqual(users, fixtures(f => f.name === 'Blandine' || (f.name > 'J' && f.age > 30)));
        });

        t.test('support order by', async t => {
            const users = await createService()
                .select()
                .orderBy('age')
                .run();

            t.deepEqual(users, fixtures().sort((a, b) => a.age - b.age));
        });

        t.test('support order by with direction', async t => {
            const users = await createService()
                .select()
                .orderBy('age', 'desc')
                .run();

            t.deepEqual(users, fixtures().sort((a, b) => b.age - a.age));
        });

        t.test('support limit', async t => {
            const users = await createService()
                .select()
                .orderBy('id')
                .limit(2)
                .run();

            t.deepEqual(users, fixtures().splice(0, 2));
        });

        t.test('support limit with offset', async t => {
            const users = await createService()
                .select()
                .orderBy('id')
                .limit(2, 1)
                .run();

            t.deepEqual(users, fixtures().splice(1, 2));
        });
    }));
};
