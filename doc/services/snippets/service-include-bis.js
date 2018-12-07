const authors = Users.select('user_id', 'first_name', 'last_name');

const lastThreeComments = Comments
    .select()
    .orderBy('published_at', 'desc')
    .limit(3);

Posts
    .select()
    .orderBy('published_at', 'desc')
    .limit(10)
    .include(authors, lastThreeComments)
    .run()
    .then(lastTenPosts => {

    });
