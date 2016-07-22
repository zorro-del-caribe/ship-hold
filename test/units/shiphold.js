const shiphold = require('../../src/shiphold');
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

test('create only a service registry per instance (not shared', t=> {
  const sh1 = shiphold();
  sh1.model('foo', function () {
    return {
      table: 'foo',
      columns: {}
    }
  });
  const sh2 = shiphold();
  sh2.model('bar', function () {
    return {
      table: 'bar',
      columns: {}
    }
  });
  t.equal(sh1.models().length, 1);
  t.end();
});