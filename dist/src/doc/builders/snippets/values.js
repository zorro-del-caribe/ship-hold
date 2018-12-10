sh
    .select()
    .from('posts')
    .where('post_id', 'IN', [123, 543, 678])
    .and('published_at', '>', new Date(2015))
    .and('user_id', 'IN', sh
        .select('user_id')
        .from('users')
        .where('last_name', 'ILIKE', 'renard')
        .noop()
    )
    .build();

//> { text:
//    'SELECT * FROM "posts" WHERE "post_id" IN (123,543,678)
//     AND "published_at" > '1970-01-01T00:00:02.015Z'
//     AND "user_id" IN
//          (SELECT "user_id" FROM "users" WHERE "last_name" ILIKE 'renard')',
//   values: [] }
