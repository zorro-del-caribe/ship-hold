const {toJson} = require('ship-hold-querybuilder');

sh
    .select('posts.post_id', 'published_at', {
        as: 'author',
        value: sh.select(toJson('"users".*'))
            .from('users')
            .where('users.user_id', '"posts"."user_id"')
            .noop()
    })
    .from('posts')
    .build();

// { text:
//    'SELECT
//          "posts"."post_id",
//          "published_at",
//          (SELECT to_json("users".*) FROM "users" WHERE "users"."user_id" = "posts"."user_id") AS "author"
//     FROM "posts"',
//   values: [] }
