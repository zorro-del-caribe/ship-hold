// Find all the posts including their author, tags and comments
Posts
    .select()
    .include(Tags.select(), Comments, 'author')
    .run()
    .then(posts => {
        /* posts will be something
        [{
            "post_id":3,
            "title":"Fugit facilis facilis",
            "content":"Veniam aliquam aut ...",
            "published_at":"2014-03-08T05:00:00.000Z",
            "user_id":26365,
            "tags":[{
                    "tag":"nobis",
                    "description":"Et rerum ..."
                },
                ...],
            "comments":[{
                    "comment_id":31110,
                    "content":"Culpa dolores ...",
                    "published_at":"1979-03-08T00:00:00",
                    "user_id":59043,
                    "post_id":3
                },
                ...],
            "author":{
                "user_id":26365,
                "email":"Wilhelm_Collins@Windler.name",
                "biography":"Et sit neque aliquid... ",
                "first_name":"Felix",
                "last_name":"Stokes"
                }
        },
        ...]
        */
    });

