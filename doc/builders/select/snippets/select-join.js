sh
    .select()
    .from('posts')
    .leftJoin('users')
    .on('posts.user_id', '"users"."user_id"')
    .build();

// is equivalent to

sh
    .select()
    .from('posts')
    .leftJoin('users', 'posts.user_id', '"users"."user_id"')
    .build();

// > { text:
//    'SELECT * FROM "posts" LEFT JOIN "users" ON "posts"."user_id" = "users"."user_id"',
//   values: [] }


sh
    .select()
    .from('posts')
    .join({
        value: sh
            .select()
            .from('users')
            .where('users.first_name', 'Laurent')
            .noop(),
        as: 'Laurents'
    })
    .on('posts.user_id', '"Laurents".user_id')
    .and('published_at', '>', new Date(2010))
    .build();

// > { text:
//    `SELECT * FROM "posts" JOIN
//     (SELECT * FROM "users" WHERE "users"."first_name" = 'Laurent') AS "Laurents" ON
//     "posts"."user_id" = "Laurents".user_id AND "published_at" > '1970-01-01T00:00:02.010Z'`,
//   values: [] }
