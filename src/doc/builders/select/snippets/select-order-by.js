sh
    .select()
    .from('posts')
    .orderBy('published_at', 'desc')
    .build();

// > { text: 'SELECT * FROM "posts" ORDER BY "published_at" DESC',
//   values: [] }
