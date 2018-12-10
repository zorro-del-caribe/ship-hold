sh
    .update('posts')
    .set('title', 'foo')
    .set('published_at', new Date(2000))
    .build();

// will be equivalent to

sh
    .update('posts')
    .set({title: 'foo', published_at: new Date(2000)})
    .build();

// > { text: `UPDATE "posts" SET "title" = 'foo', "published_at" = '1970-01-01T00:00:02.000Z'`,
//     values: [] }
