const {count} = require('ship-hold-querybuilder');

// Find how many articles each user has written
sh
    .select(count('*'), 'user_id')
    .from('posts')
    .groupBy('user_id')
    .build();

// { text: 'SELECT count(*), "user_id" FROM "posts" GROUP BY "user_id"',
//   values: [] }
