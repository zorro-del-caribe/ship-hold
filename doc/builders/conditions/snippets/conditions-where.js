const Laurents = sh
    .select('user_id')
    .from('users')
    .where('first_name', 'Laurent')
    .noop(); // call noop !!!

sh
    .select()
    .from('posts')
    .where('user_id', 'IN', Laurents)
    .build();

// > { text:
//    `SELECT * FROM "posts" WHERE "user_id" IN
//     SELECT "user_id" FROM "users" WHERE "first_name" = 'Laurent')`,
//   values: [] }
