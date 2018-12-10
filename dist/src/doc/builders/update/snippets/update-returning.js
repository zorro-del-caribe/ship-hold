sh
    .update('posts')
    .set('title', 'new title')
    .where('posts.user_id', 42)
    .returning('*')
    .build();

// > { text:
//    `UPDATE "posts" SET "title" = 'new title' WHERE "posts"."user_id" = 42 RETURNING *`,
//   values: [] }
