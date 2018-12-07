const postReferences = Posts.select('post_id', 'title');

const getComments = (operator = '<') => Comments
    .select()
    .where('published_at', operator, new Date(2010, 1, 1))
    .orderBy('published_at', 'desc')
    .include(postReferences.clone());

const [user] = Users
    .select()
    .where('first_name', 'Laurent')
    .and('last_name', 'Renard')
    .include(
        {as: 'oldComments', value: getComments()},
        {as: 'recentComments', value: getComments('>')})
    .run()
    .then(laurentRenard => {
        //
    });
