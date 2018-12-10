sh
    .select()
    .from('posts')
    .where('posts.user_id', 42)
    .and('published_at', '>', new Date(2010, 1, 1))
    .build();

//{ text:
//    `SELECT * FROM "posts" WHERE
//      "posts"."user_id" = 42 AND
//      "published_at" > '2010-02-01T05:00:00.000Z'`,
//   values: [] }
