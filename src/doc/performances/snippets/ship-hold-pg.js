pg.query(`SELECT "posts".*, to_json("users".*) as "author"
                FROM 
            (SELECT * FROM "posts" ORDER BY "published_at" DESC LIMIT 5) as "posts" 
                JOIN "users" 
        ON "posts"."user_id" = "users"."user_id"
`);

// > 18ms


sh.select('posts.*', {
    value: toJson('"users".*'),
    as: 'author'
})
    .from({
        value: sh.select()
            .from('posts')
            .orderBy('published_at', 'desc')
            .limit(5), as: 'posts'
    })
    .join('users')
    .on('posts.user_id', '"users"."user_id"')
    .run();

// > 23ms

// This one will actually generate different type of query but will get the same result
Posts
    .select()
    .orderBy('published_at', 'desc')
    .limit(5)
    .include(Users)
    .run();

// > 26ms

// As indication, with Sequelize I get something like 76ms
