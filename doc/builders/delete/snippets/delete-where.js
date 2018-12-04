sh
    .delete('posts')
    .where('posts.user_id', 42)
    .and('published_at', '<', new Date(2015))
    .build();

// >  { text:
//    `DELETE FROM "posts" SET WHERE
//     "posts"."user_id" = 42 AND "published_at" < '1970-01-01T00:00:02.015Z'`,
//   values: [] }
