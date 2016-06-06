const pg = require('pg');
const connection = 'postgres://docker:docker@192.168.99.100:5432/ship-hold-test';
const test = require('tape');
const shiphold = require('../../shiphold');

let fixtures = [];

function getFixtures () {
  return fixtures.map(f=>Object.assign({}, f));
}

function createModels () {
  const sh = shiphold({
    hostname: '192.168.99.100',
    username: 'docker',
    password: 'docker',
    database: 'ship-hold-test'
  });

  const Users = sh.model('Users', function () {
    return {
      table: 'user_simple_select',
      columns: {
        id: 'integer',
        age: 'integer',
        name: 'string'
      }
    };
  });

  Object.assign(sh.adapters, {
    test(params = {}, assertions, expected) {
      this.stream(params, function * () {
        try {
          while (true) {
            const row = yield;
            assertions.deepEqual(row, expected.shift());
          }
        } catch (e) {
          assertions.fail(e);
        }
        finally {
          sh.stop();
          assertions.end();
        }
      })

    }
  });

  return Users;
}

test('add fixture', t=> {
  pg.connect(connection, function (err, client, done) {
    const query = `INSERT INTO user_simple_select(name, age) 
      VALUES 
      ('Laurent',29),
      ('Jesus', 2016),
      ('Raymond',55),
      ('Blandine',29)
      RETURNING *`;

    client.query(query, function (err, result) {
      t.error(err);
      t.equal(result.rows.length, 4);
      fixtures = result.rows;
      done();
      t.end();
    });
  });
});

test('select all', t=> {
  createModels()
    .select()
    .orderBy('id')
    .test({}, t, getFixtures())
});

test('select specified fields', t=> {
  createModels()
    .select('name', 'age')
    .orderBy('id')
    .test({}, t, getFixtures().map(r=> {
      return {name: r.name, age: r.age};
    }))
});

test('support where simple where clause', t=> {
  createModels()
    .select()
    .where('id', 3)
    .test({}, t, getFixtures().filter(x=>x.id === 3));
});

test('support parameters in where clause', t=> {
  createModels()
    .select()
    .where('id', '$id')
    .test({id: 4}, t, getFixtures().filter(x=>x.id === 4))
});

test('support complex query', t=> {
  createModels()
    .select()
    .where('age', '>', 20)
    .and('name', 'Laurent')
    .test({}, t, getFixtures().filter(x=>x.age > 20 && x.name === 'Laurent'));
});

test('support complex query with parameters', t=> {
  createModels()
    .select()
    .where('age', '<', '$age')
    .and('name', '$name')
    .test({age: 50, name: 'Blandine'}, t, getFixtures().filter(x=>x.age < 50 && x.name === 'Blandine'));
});

test('support sub query', t=> {
  const model = createModels();
  const subq = model.if('name', '>', 'J').and('age', '>', 30);

  model
    .select()
    .where('name', 'Blandine')
    .or(subq)
    .test({}, t, getFixtures().filter(f=>f.name === 'Blandine' || (f.name > 'J' && f.age > 30)));
});

test.skip('support sub query with parameters', t=> {
  const model = createModels();
  const subq = model.if('name', '>', 'J').and('age', '>', 30);

  model
    .select()
    .where('name', 'Blandine')
    .or(subq)
    .test({}, t, getFixtures().filter(f=>f.name === 'Blandine' || (f.name > 'J' && f.age > 30)));
});

test('support order by', t=> {
  createModels()
    .select()
    .orderBy('age')
    .test({}, t, getFixtures().sort((a, b)=>a.age - b.age));
});

test('support order by with direction', t=> {
  createModels()
    .select()
    .orderBy('age', 'desc')
    .test({}, t, getFixtures().sort((a, b)=>b.age - a.age));
});

test('support limit', t=> {
  createModels()
    .select()
    .orderBy('id')
    .limit(2)
    .test({}, t, getFixtures().splice(0, 2))
});

test('support limit with offset', t=> {
  createModels()
    .select()
    .orderBy('id')
    .limit(2, 1)
    .test({}, t, getFixtures().splice(1, 2));
});



