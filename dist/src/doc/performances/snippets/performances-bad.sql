WITH
    "Posts" AS (SELECT * FROM "posts"),
    "author" AS (SELECT * FROM "users" WHERE "users"."user_id" IN (SELECT "user_id" FROM "Posts"))
SELECT
    "Posts".*,
    (SELECT (to_json("author".*)) AS "author" FROM "author" WHERE "author"."user_id" = "Posts"."user_id") AS "author"
FROM "Posts"
