const latestPostgresPosts = await sh
    .select()
    .from('posts')
    .where('title', 'ILIKE', '$title')
    .orderBy('published_at', 'desc')
    .run({
        title: '%postgres%'
    });

// latestPostgresPosts will be an array with all the posts
// whose title container "postgres", ordered by publication date
