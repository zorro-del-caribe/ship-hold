const b = sh.select().from('users');
const b2 = b.clone().where('first_name', 'Laurent');

Object.is(b, b2);
// > false
b.build();
// > { text: 'SELECT * FROM "users"', values: [] }
b2.build();
// > { text: 'SELECT * FROM "users" WHERE "first_name" = 'Laurent', values: [] }
