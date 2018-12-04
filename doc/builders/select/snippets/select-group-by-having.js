const {count} = require('ship-hold-querybuilder');

// only users who have published more than 3 articles
sh
    .select(count('*'), 'user_id')
    .from('posts')
    .groupBy('user_id')
    .having('posts.count','>',3)
    .build();

// { text:
//    'SELECT count(*), "user_id" FROM "posts" GROUP BY "user_id"
//     HAVING "posts"."count" > 3',
//   values: [] }
