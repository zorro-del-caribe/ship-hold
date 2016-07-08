const test = require('tape');
const shiphold = require('../../shiphold');

test('bind query to proper table', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .delete()
    .build()
    .text;

  const expected = 'DELETE FROM "users"';
  t.equal(query, expected);
  t.end();
});