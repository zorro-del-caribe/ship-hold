const {pageSize} = require('../config/example');
const {Pool} = require('pg');
const {Users, Posts, Tags, Comments, sh} = require('../scripts/ship-hold');
const {toJson} = require('ship-hold-querybuilder');

const {hostname: host, username: user, password, database} = require('../config/db');
const pg = new Pool({host, user, password, database});

(async function () {
    try {
        const now = Date.now();

        // const posts = (await pg.query(`
        //     SELECT "posts".*, to_json("users".*) as "author"
        //         FROM (SELECT * FROM "posts" ORDER BY "published_at" DESC LIMIT 5) as "posts" JOIN "users" ON "posts"."user_id" = "users"."user_id"
        // `)).rows;

        const posts = await Posts
            .select()
            .orderBy('published_at','desc')
            .limit(5)
            .include(Users)
            .run()

        // const posts = await sh.select('posts.*', {
        //     value: toJson('"users".*'),
        //     as: 'author'
        // })
        //     .from({
        //         value: sh.select().from('posts').orderBy('published_at', 'desc')
        //             .limit(5), as: 'posts'
        //     })
        //     .join('users')
        //     .on('posts.user_id', '"users"."user_id"')
        //     .run();

        console.log(`executed in ${Date.now() - now}ms`);
        // console.log(JSON.stringify(posts))

    } catch (e) {
        console.log(e);
    } finally {
        sh.stop();
    }
})();

