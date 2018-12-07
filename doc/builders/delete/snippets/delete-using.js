sh
    .delete('users')
    .using('posts')
    .where('users.user_id', '"posts"."user_id"')
    .and('posts.published_at', '<', new Date(2000))
    .build();

// { text:
//    `DELETE FROM "users" USING "posts" WHERE
//      "users"."user_id" = "posts"."user_id" AND "posts"."published_at" < '1970-01-01T00:00:02.000Z'`,
//   values: [] }
