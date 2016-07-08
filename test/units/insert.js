const test = require('tape');
const shiphold = require('../../shiphold');

test('bind query to proper table', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .insert()
    .value('foo', 'bar')
    .build()
    .text;

  const expected = 'INSERT INTO "users" ( "foo" ) VALUES ( \'bar\' ) RETURNING *';
  t.equal(query, expected);
  t.end();
});

test('bind query to proper table with forwarded arguments', t=> {
  const model = shiphold()
    .model('Users', function (sh) {
      return {table: 'users', columns: {}, relations: {}};
    });
  const query = model
    .insert({foo: 'bar', woot: 'what'})
    .build()
    .text;

  const expected = 'INSERT INTO "users" ( "foo", "woot" ) VALUES ( \'bar\', \'what\' ) RETURNING *';
  t.equal(query, expected);
  t.end();
});