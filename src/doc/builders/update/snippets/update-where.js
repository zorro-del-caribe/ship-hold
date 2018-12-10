sh
    .update('posts')
    .set('title', `"posts"."title" || ' (old)'`)
    .where('posts.user_id', 42)
    .and('published_at', '<', new Date(2015))
    .build();

// >  { text:
//    `UPDATE "posts" SET "title" = "posts"."title" || ' (old)' WHERE
//     "posts"."user_id" = 42 AND "published_at" < '1970-01-01T00:00:02.015Z'`,
//   values: [] }
