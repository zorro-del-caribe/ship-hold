const test = require('tape');
const shiphold = require('../../shiphold');

test('bind query to proper table', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .select()
    .build()
    .text;

  const expected = 'SELECT * FROM "users"';
  t.equal(query, expected);
  t.end();
});

test('bind query to proper table with forwarded arguments', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .select('foo',{value:'bar',as:'blah'})
    .build()
    .text;

  const expected = 'SELECT "foo", "bar" AS "blah" FROM "users"';
  t.equal(query, expected);
  t.end();
});






