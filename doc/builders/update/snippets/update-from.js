sh
    .update('posts')
    .set('title', `"posts"."title" || ' by ' || "users"."first_name"`)
    .from('users')
    .where('posts.user_id', '"users"."user_id"')
    .and('posts.post_id',2)
    .build();

//{ text:
//    `UPDATE "posts" SET "title" = "posts"."title" || ' by ' || "users"."first_name"
//     FROM "users" WHERE "posts"."user_id" = "users"."user_id" AND "posts"."post_id" = 2`,
//   values: [] }
