1. [ ] I have provided a description of the issue in English:

> My issue is about ordering result with a select builder

2. [ ] I have specified the version of ship-hold I use.

> 1.0.0

3. [ ] my issue is a **bug report** or a **feature request**. Please **NO QUESTION** use stackoverflow or the chat (Preferably stackoverflow so the question can be indexed by search engines)

> Bug

4. [ ] If it is an issue, provide your models, the sql query (you can use the DEBUG=ship-hold env var to print the query) and the expected sql query if you know it.

```javascript

sh.model('Users',function (h){
   return {
      table:'users',
      columns:{},
      relations:{}
   };
});

Users
  .select('id')
  .build()

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

6. [ ] If it is a feature request: keep in mind that ship-hold favors extension module architecture over monolithic module. So your feature request will likely be refused. Don't hesitate to open it though so it may be open to upvote. However, It is not democracy :) !

> would be great if we had "findById" method on the model services, what do you think ?
