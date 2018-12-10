sh
    .delete('posts')
    .where('posts.user_id', 42)
    .returning('*')
    .build();

// > { text:
//    `DELETE FROM "posts" WHERE "posts"."user_id" = 42 RETURNING *`,
//   values: [] }
