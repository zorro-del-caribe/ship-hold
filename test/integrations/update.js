const test = require('tape');

module.exports = function (sh) {

  let fixtures = [];

  function createModels () {
    return sh.model('Users', function () {
      return {
        table: 'users_update',
        columns: {
          id: 'integer',
          age: 'integer',
          name: 'string'
        }
      };
    });
  }

  test('add fixture', t=> {
    sh.getConnection()
      .then(function ({client, done}) {
        client.query(`INSERT INTO users_update(name, age)
        VALUES
        ('Laurent',29),
        ('Jesus',2016),
        ('Raymond',55),
        ('Blandine',29)
        RETURNING *;
        `, function (err, result) {
          t.error(err);
          t.equal(result.rows.length, 4);
          fixtures = result.rows;
          done();
          sh.stop();
          t.end();
        });
      });
  });

  test('update a bunch of rows', t=> {
    const Users = createModels();
    Users
      .update()
      .set('age', '$age')
      .where('age', 29)
      .test({age: 30}, t, fixtures.filter(f=>f.age === 29).map(o=> {
        return Object.assign({}, o, {age: 30});
      }));
  });

  test('update a bunch of row using object notation', t=> {
    const Users = createModels();
    Users
      .update()
      .set({name: '$name'})
      .where('name', 'Jesus')
      .test({name: 'updated'}, t, fixtures.filter(t=>t.name === 'Jesus').map(o=> {
        return Object.assign({}, o, {name: 'updated'});
      }));
  });
};