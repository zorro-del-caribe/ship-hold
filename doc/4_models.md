## Models

ship-hold lets you define models so you'll have services with convenient api to query a given type of data. It is also useful to define the relations between your models
and give you the ability to eagerly load dependant model instances without the trouble of writing sophisticated sql join queries (and parse/aggregate the response). Finally, services can easily be [extended](extend-all-the-services-by-modifying-the-service-prototype) to provide
an API that fits the best your needs.

### define a model

Use the **model** method on the ship-hold instance.

#### model method

Parameters: (modelName, [definitionFunction]): the modelName is the key used to register a given model, the definition function is a function which must return
the definition.

Returns: the model service.

Example:

```javascript

sh.model('Users',function (h){
    return {
        table:'users' //the table name (required)
        columns:{ //required
          id:'integer',
          name:'string',
          email:'string'
          age:'integer'
        },
        relations:{ // see later for relations
          products:h.hasMany('Products'),
          phone:h.hasOne('Phones'),
          accounts:h.belongsToMany('Accounts','UsersAccounts','userId')
        }
    };
});

```

Note: the columns object must declare all the properties as keys, what you put as value does not really matter. It may depend on conventions extension modules will use for
validation, etc

If you omit the definitionFunction the **model** method becomes a getter to retrieve the model service. All services are singletons.

```javascript

sh.model('Users') === sh.model('Users') // true (same object)

```

### relations definition

The definition function has a relation helper as first argument to let you define the relation between your models.

* #### one to many

 Assuming a user has many products and a product belongs to a given user.

 ```javascript

 sh.model('Users',function(h){
    return {
        table:'users',
        columns:{
        /* columns */
        },
        relations:{
           products:h.hasMany('Products') // target model name
        }
    };
 });

 sh.model('Products',function(h){
    return {
        table:'products',
        columns:{
        /* columns ... */
            userId : 'integer'
        },
        relations:{
           owner:h.BelongsTo('Users', 'userId') // target model name, and foreign key which references the user (as owner)
        }
    };
 });

 ```

* #### one to one

 Assuming a user has one phone number and one phone number belongs to a given user.

 ```javascript

 sh.model('Users',function(h){
    return {
        table:'users',
        columns:{
        /* columns */
        },
        relations:{
           phone:h.hasOne('Phones') // target model name
        }
    };
 });

 sh.model('Phones',function(h){
    return {
        table:'phones',
        columns:{
        /* columns ... */
            userId : 'integer'
        },
        relations:{
           human:h.BelongsTo('Users', 'userId') // target model name, and foreign key which references the User (as human)
        }
    };
 });

 ```

* #### many to many
 
 Assuming a user has many bank accounts and a bank accounts can belong to many users. The mapping being done by a join table "users_accounts".
 
 ```javascript

 sh.model('Users',function(h){
    return {
        table:'users',
        columns:{
        /* columns */
        },
        relations:{
           accounts:h.belongsToMnay('Accounts','UsersAccounts','userId') // target model name, model name for the join table, column which references users in the join table
        }
    };
 });

 sh.model('Accounts',function(h){
    return {
        table:'accounts',
        columns:{
            /* columns ... */
        },
        relations:{
           owners:h.BelongsToMany('Users','UsersAccounts','accountId') // target model name, model name for the join table, column which references accounts in the join table
        }
    };
 });
 
 // the join table model
 sh.model('UsersAccounts',function(h){
    return {
        table:'users_accounts',
        columns:{
          id:'integer'
          userId:'integer',
          accountId:'integer'
        }
    }
 });

 ```
 
 Note: in order to work, the join model must exists. However, you can use an extension to generate automatically these join models if you don't particularly need to query them. 

### Model service API

All the model services will have **select**, **insert**, **update**, **delete** methods which will let you create [query builders]() bound to the related table.

```javascript

Users
    .select('id','name')
    .where('id','$id')
    .run({id:1})
    .then(rows=>{
        console.log(rows);
    });
  // [{id:1, name:'Laurent'}]

```

The **select** builder will be decorated with an **include** method to provide eager loading.
 
#### include (eager loading)

When querying a model, you can specify its relation you want to include with the **include** method. The include method takes a list of builders which will be used to create the join sub queries.

```javascript

Users
    .select('id', 'name', 'age')
    .include(Products.select('id','price','title'), Phones.select('id','number'))
    .run()
    .then(results => console.log(results));
    /* [{
          id:1,
          name:'Laurent',
          age:29, 
          phone: {
            id:345,
            number:'23948797'
          },
          products:[{ id:23,
            title:'sun glasses', 
            price:19.9
            },
            { id:34,
            tile:'shirt',
            price:9.99
          }]
        }, /* ... */]
    */

```

Alternatively, if you want to select all the properties of nested models, you can simply pass the related model service or even the string referring to the relation name.

```javascript

Products
    .select('id','title','price')
    .include(Users)
    .run()

// is equivalent to

Products
    .select('id','title','price')
    .include(Users.select())
    .run()

// is equivalent to

Products
    .select('id','title','price')
    .include('owner')
    .run()

```

It is important to note that include returns a **new** query builder as it needs to modify the sql query to add the required join clauses etc. So any builder method called after
the include method will be applied to the new query builder

```Javascript

Users
    .select()
    .where('age','>',18)
    .include(Products)
    .build() // somehow "SELECT .. FROM (SELECT * FROM users WHERE users.age > 18) AS users JOIN (SELECT * FROM products) AS products ON users.id = products.userId"  
 
 // is different than
 
Users
    .select()
    .include(Products)
    .where('age','>',18)
    .build() // somehow "SELECT .. FROM (SELECT * FROM users ) AS users JOIN (SELECT * FROM products) AS products ON users.id = products.userId" WHERE age > 18

```

You can nest the includes.

```Javascript

Products
    .select()
    .include(Users.select().include(Phones))
    .run()

```

But keep in mind that the more you include the more joins you do (and therefore you ask for more data), and the efficiency of the request can decrease.
 
To be efficient and stream rows as fast as possible, ship-hold use a diff algorithm between the rows coming from the database and the currently aggregated model row so model instances can be streamed out as soon as possible.

For example:

```Javascript

Users
    .select('id','name')
    .orderBy('name')
    .include(Products.select('id','price','title'))
    .stream({}, function * (){
        try{
            while(true){
                const row = yield;
                console.log(row);
            }
        } catch(e){
            console.log(e);
        } finally {
            console.log('done');
        }
    });

```

will result in the following sql query:

```sql

SELECT "users"."id" AS "id", "users"."name" AS "name", "products"."id" AS "products.id", "products"."price" AS "products.price", "products"."title" AS "products.title" FROM (SELECT * FROM "users" ORDER BY "name") AS "users" LEFT JOIN (SELECT * FROM "products") AS "products" ON "users"."id" = "products"."userId" ORDER BY "name"

```

The database will send rows as following

id | name | products.id | products.price | products.title
---|------|-------------|----------------|---------------
3 | Blandine | 4 | 12.4 | skirt
3 | Blandine | 6 | 15 | ring
1 | Laurent | 1 | 19.9 | sun glasses
1 | Laurent | 8 | 21.6 | shirt
... | ... | ... | ... | ... |

And the result of the code above

```Javascript

//{id:3,name:'Blandine',products:[{id:4,price:12.4,title:'skirt'},{id:6,price:15,title:'ring'}]} -> Blandine user is streamed out even if data is still coming from the database stream
//{id:1,name:'Laurent',products:[{id:1,price:19.9,title:'sun glasses'},{id:8,price:21.6,title:'shirt'}]} -> Laurent user is streamed out even if data is still coming from the database stream
//...
// done

```

The diff algorithm uses the primary keys of the different models which means
1. You must include primary keys in you different select clauses

2. rows must be ordered in a manner that the database send all the rows corresponding to an instance of the main model, then all the rows for a second model instance, etc. In practice
it will be the default query plan most of the time but in particular cases (with a lot of joins for example) you gonna have to force the order to be sure.


```Javascript

Users
    .select()
    .orderBy('name') // (or id,etc) safer to add an order clause.
    .include(Products,Phones,Accounts.select().include(Banks),..)

```

