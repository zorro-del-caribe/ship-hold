sh
    .if('posts.published_at', '>', new Date(2010, 1, 1))
    .and('title', 'foo')
    .or(sh.if('posts.user_id', 'IN', sh.select('user_id').from('users')))
    .build();

// > { text:
//    `"posts"."published_at" > '2010-02-01T05:00:00.000Z' AND
//      "title" = 'foo' OR ("posts"."user_id" IN (SELECT "user_id" FROM "users"))`,
//   values: [] }
