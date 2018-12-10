sh
    .select()
    .from('posts', 'public.users', {
        value: sh.select().from('comments'),
        as: 'comzz'
    })
    .build();

// { text:
//    'SELECT * FROM
//      "posts",
//      "public"."users",
//      (SELECT * FROM "comments") AS "comzz"',
//   values: [] }
