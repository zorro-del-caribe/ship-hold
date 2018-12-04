// const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');
// const {count} = require('ship-hold-querybuilder');

const {hostname: host, username: user, password, database} = require('../config/db');
const {shiphold} = require('../../dist/bundle');
const {toJson, count} = require('ship-hold-querybuilder');

const sh = shiphold({host, user, password, database});

(async function () {
    try {

        // console.log(sh.insert('id', 'first_name', 'last_name')
        //     .values([
        //         {first_name: 'Laurent', last_name: 'Renard'},
        //         {first_name: 'Charlie', last_name: 'Renard'}
        //     ])
        //     .into('users')
        //     .returning('id')
        //     .build());

        console.log(sh
            .select()
            .from('posts')
            .orderBy('published_at','desc')
            .limit(10, 20)
            .build());


        //     WITH moved_rows AS (
        //         DELETE FROM products
        //     WHERE
        //     "date" >= '2010-10-01' AND
        //     "date" < '2010-11-01'
        //     RETURNING *
        // )
        //     INSERT INTO products_log
        //     SELECT * FROM moved_rows;


        // const Dishes = sh.service({
        //     name: 'Dishes',
        //     table: 'dish',
        //     primaryKey: 'id'
        // });
        //
        // const Items = sh.service({
        //     name: 'Items',
        //     table: 'item',
        //     primaryKey: 'id'
        // });
        //
        // const Ingredients = sh.service({
        //     name: 'Ingredient',
        //     table: 'ingredient'
        // });
        //
        // Dishes.belongsToMany(Items, 'ingredient', 'dish_id', 'items');
        // Items.belongsToMany(Dishes, 'ingredient', 'item_id', 'dishes');
        //
        // Ingredients.belongsTo(Dishes, 'dish_id', 'dish');
        // Ingredients.belongsTo(Items, 'item_id', 'item');
        //
        // Dishes.hasMany(Ingredients, 'ingredients');
        // Items.hasMany(Ingredients, 'ingredients');
        //
        // const r = await Ingredients.select('ingredient.quantity', 'ingredient.unit', 'item.name', 'item.type')
        //     .leftJoin('item')
        //     .on('item.id', '"ingredient"."item_id"')
        //     .where('dish_id', '$dish')
        //     .debug({dish: 1});
        //
        // console.table(r);


        // const posts = await Posts
        //     .select()
        //     .leftJoin('users')
        //     .on('posts.user_id', `"users"."user_id"`)
        //     .leftJoin('comments')
        //     .on('comments.post_id', `"posts"."post_id"`)
        //     .run();

        // console.log(JSON.stringify(posts));
        // const mostProlificAuthor = Posts
        //     .select('user_id', count('*'))
        //     .where('published_at', '>', new Date(2015, 1, 1))
        //     .groupBy('user_id')
        //     .orderBy('count', 'desc')
        //     .limit(5);
        //
        // const lastPostWithCommentsAndTags = Posts
        //     .select()
        //     .orderBy('published_at', 'desc')
        //     .limit(1)
        //     .include(
        //         Comments
        //             .select()
        //             .orderBy('published_at', 'desc')
        //             .limit(5),
        //         Tags
        //     );
        //
        // const users = await Users
        //     .select()
        //     .where('user_id', 'IN', sh.select('user_id').from({
        //         value: mostProlificAuthor,
        //         as: 'most_prolific'
        //     }))
        //     .include(
        //         lastPostWithCommentsAndTags
        //     )
        //     .run();
        //
        // console.log(JSON.stringify(users));

        // console.log(result);
    } catch (e) {
        console.log(e);
        process.exit(1);
    } finally {
        sh.stop();
    }
})();
