// fetch the third page (page size = 10) of the latest posts
sh
    .select()
    .from('posts')
    .orderBy('published_at', 'desc')
    .limit(10, 20)
    .build();

// { text:
//    'SELECT * FROM "posts" ORDER BY "published_at" DESC LIMIT 10 OFFSET 20',
//   values: [] }
