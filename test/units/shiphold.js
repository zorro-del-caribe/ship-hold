const shiphold = require('../../shiphold');
const test = require('tape');

test('service registry', t=> {
  const sh = shiphold();
  const Users = sh.model('Users', function (sh) {
    return {table: 'users', columns: {}};
  });
  const Users2 = sh.model('Users');
  t.equal(Users, Users2, 'services should be singletons');
  t.end();
});