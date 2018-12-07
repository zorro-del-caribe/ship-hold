1. [ ] I have provided a description of the issue in English:

> My issue is about ordering result with a select builder

2. [ ] I have specified the version of ship-hold I use and the version of Postgres I use.

> sh: 2.0.0
> pg: 10

3. [ ] my issue is a **bug report** or a **feature request**. If you have a **question** prefer stackoverflow or the chat (Preferably stackoverflow so the question can be indexed by search engines)

> Bug

4. [ ] If it is an issue, provide some code do reproduce (ideally it would also include a sql script to create the database), the SQL query (you can use ``.debug()`` method instead of ``run()`` to print it) and the expected SQL query if you know it.

```javascript

const Users = sh.service({
    table:'users'
});

Users
  .select('id')
  .debug()

```

I have

```sql
SELECT * FROM "users"
```

I expected

```sql
SELECT "id" FROM "users"
```

5. [ ] If it is an issue, provide a small data set and the expected result.

> you can reproduce with the following fixture ...

6. [ ] If it is a feature request: keep in mind that ship-hold favors extension module architecture over monolithic module. So your feature request will likely be refused. Don't hesitate to open it though so it may be open to upvotes. However, It is not democracy :) !

> would be great if we had "findById" method on the model services, what do you think ?
