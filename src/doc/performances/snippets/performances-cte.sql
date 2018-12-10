WITH
    "Posts" AS (SELECT * FROM "posts" WHERE "user_id" = 42 ORDER BY "published_at" DESC LIMIT 5),
    "comments" AS (SELECT * FROM "comments" WHERE "comments"."post_id" IN (SELECT "post_id" FROM "Posts")),
    "author" AS (SELECT * FROM "users" WHERE "users"."user_id" IN (SELECT "user_id" FROM "Posts"))
SELECT
    "Posts".*,
    (SELECT (COALESCE(json_agg("comments".*),'[]'::json)) AS "comments"
        FROM (SELECT * FROM "comments" WHERE "comments"."post_id" = "Posts"."post_id") AS "comments"),
    (SELECT (to_json("author".*)) AS "author"
        FROM "author" WHERE "author"."user_id" = "Posts"."user_id") AS "author"
FROM "Posts" ORDER BY "published_at" DESC
