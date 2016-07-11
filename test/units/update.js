const test = require('tape');
const shiphold = require('../../src/shiphold');

test('bind query to proper table', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .update()
    .set('foo','bar')
    .build()
    .text;

  const expected = 'UPDATE "users" SET "foo" = \'bar\' RETURNING *';
  t.equal(query, expected);
  t.end();
});