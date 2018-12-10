sh
    .select()
    .with('old_articles', sh
        .delete()
        .from('posts')
        .where('published_at', '<', new Date(2000, 1, 1))
        .returning('*')
    )
    .from('old_articles')
    .where('user_id', 42)
    .build();

// { text:
//     `WITH "old_articles" AS (DELETE FROM "posts" WHERE "published_at" < '2000-02-01T05:00:00.000Z'
//      RETURNING *)
//      SELECT * FROM "old_articles" WHERE "user_id" = 42`,
//   values: [] }
