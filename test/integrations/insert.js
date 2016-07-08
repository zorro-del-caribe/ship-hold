const test = require('tape');

module.exports = function (sh) {

  function createModel () {
    return sh.model('Users', function () {
      return {
        table: 'users_insert',
        columns: {
          id: 'integer',
          age: 'integer',
          name: 'string'
        }
      }
    });
  }

  test('add a user and return it', function (t) {
    const Users = createModel();
    Users
      .insert({age: '$age', name: '$name'})
      .test({age: 29, name: 'Laurent'}, t, [
        {id: 1, name: 'Laurent', age: 29}
      ]);
  });

  test('add a user with the values notation', function (t) {
    const Users = createModel();
    Users
      .insert()
      .value('age', '$age')
      .value('name', '$name')
      .test({age: 29, name: 'Blandine'}, t, [
        {id: 2, name: 'Blandine', age: 29}
      ]);
  });
};

