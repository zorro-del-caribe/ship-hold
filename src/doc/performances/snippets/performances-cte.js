Posts
    .select()
    .orderBy('published_at','desc')
    .where('user_id', 42)
    .limit(5)
    .include(Comments, Users)
    .debug();
