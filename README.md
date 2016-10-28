# Ship-hold

[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)
[![Gitter](https://badges.gitter.im/zorro-del-caribe/ship-hold.svg)](https://gitter.im/zorro-del-caribe/ship-hold?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Introduction

**ship-hold** is a data access framework for [Postgres](https://www.postgresql.org/) relational database system, developed for the [nodejs](https://nodejs.org/) platform (version > 6, if not transpiled).
It is based around intuitive [sql query builders](#query-builders) and allows you as well to manage model definitions and relations (with eager loading, etc). It defers quite a lot from other popular libraries so called **ORM** such [sequelize](http://docs.sequelizejs.com/) or [Bookshelf](http://bookshelfjs.org/):  
they usually come with a lot of features (schema management, migrations, validations, etc) and more complex API's / code base (few thousands of sloc). 
However, ship-hold focuses on a limited set of features and a very powerful [extension mechanism](#extend-ship-hold). As a result, [ship-hold-querybuilder](https://github.com/zorro-del-caribe/ship-hold-querybuilder) code base is less than 450 sloc and less than 600 for ship-hold itself. The idea is to build [extension modules](#list-of-extension-modules) with their own purposes/opinions, a little bit like popular web frameworks such [koajs](http://koajs.com/).
  
## table of content

1. [getting started](#getting-started)
2. [query builders](#query-builders)
3. [query runner](#query-runner-and-api-adapters)
4. [models](#models)
5. [extensions](#extend-ship-hold)
6. [performances](#performances)
7. [sample application](#sample-application)
8. [contributing](#contributing)

##Getting started

### Install
run in your terminal ``npm install ship-hold`` (assuming you have [npm](https://npmjs.org) installed)

### initialisation

Pass database connection information to the ship-hold factory

```Javascript

const shiphold = require('ship-hold');
const sh = shiphold({
    hostname:'192.168.99.100'
    username:'docker',
    password:'docker',
    database:'dev'
});

```

Define your models and the relations between them.

```Javascript

const Users=sh.model('Users',{
    table:'users',
    columns:{
        id:'integer',
        age:'integer',
        name:'varchar'
    }
});

```

And start using the query builders.

```Javascript

Users
    .select('name','age')
    .where('name','Laurent')
    .run()
    .then(rows => {console.log(rows)}); // [{name:'Laurent',age:29}]
```

## Query builders

Ship-hold is built around few sql query builders for regular database operations (SELECT, INSERT, UPDATE, DELETE). You can access them from the ship-hold instance itself of from the different [model services](#models) (in this case the builders will be bound to the table related to the model service).
All the query builders have a **build** method which will return an object with the sql statement as the **text** property and the [parameters values](query-with-parameters) as the **values** property. This is only string manipulation so you don't need a
real database connection to use the build method.

Note: query builders are extended with [query runner](query-runner-and-api-adapters) which will allow you to run the query (and parse the response) against a real database.

### Select query builder.
    
Parameters: the list of field you want to return (nothing is equivalent to '*').

Returns: a select query builder.

Example:

```Javascript

sh
    .select('id','age')
    .from('users')
    .build() // { text: 'SELECT "id", "age" FROM "users"', values: [] }
    
//equivalent too
Users
    .select('id','age')
    .build();
  
```

#### Select query builder api
    
* ##### from

 Will add a **FROM** clause.

 Parameters: the list of table you want to query from.

 Returns: itself.

 Example:

 ```Javascript
 
 sh
    .select('id','age','number')
    .from('users','phones')
    .build() // { text: 'SELECT "id", "age", "number" FROM "users", "phones"', values: [] }
   
 ```

 Alternatively, you can pass another builder as argument

 ```Javascript
 
 sh
    .select()
    .from({value:sh.select('id').from('users'),as:'users'}) //sql subquery must have an alias
    .build() //{ text: 'SELECT * FROM (SELECT "id" FROM "users") AS "users"',values: [] }
 
 ```

* ##### where 
    
 Will add a **WHERE** clause.

 Parameters: (leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

 Returns: a [condition query builder](#condition-query-builder-if) proxied with the main select builder. You'll be able to chain with conditional builder specific methods but if you use a method of the main select builder, it will fallback to the main select builder and revoke the proxy.

 Example:

 ```Javascript
 
 sh
    .select()
    .from('users')
    .where('name','laurent')
    .and('age','>',20) // chain with condition builder method
    .orderBy('name') // proxy back to main select builder
    .build() // {text:'SELECT * FROM "users" WHERE "name" = \'laurent\' AND "age" > 20 ORDER BY "name"' ORDER BY "name", values:[]} 
 
 ```
    
 alternatively you can pass another builder as operand.

 ```Javascript
 
 sh
    .select()
    .from('users')
    .where('id','in',sh.select('id').from('users').orderBy('name').limit(10))
    .build() // {text: 'SELECT * FROM "users" WHERE "id" in (SELECT "id" FROM "users" ORDER BY "name" LIMIT 10)', values:[]}
 
 ```

 Note: a left operand string is considered as identifier by default whereas the right operand string will be considered as value. So if you want to use an identifier instead, you will need to wrap it with quotes.

 ```Javascript
 
 sh
    .select()
    .from('users','products')
    .where('users.id','"products"."userId"')
    .build() // { text: 'SELECT * FROM "users", "products" WHERE "users"."id" = "products"."userId"', values: [] }
 
 ```
    
* ##### orderBy
    
 Will add a **ORDER BY** clause.

 Parameters: (property,[direction]). direction can be omitted or either 'desc' or 'asc'.
  
 Returns: itself.
 
 Example:
 
 ```Javascript
 
 sh
    .select()
    .from('users')
    .orderBy('age','desc')
    .orderBy('email')
    .build() // { text: 'SELECT * FROM "users" ORDER BY "age" DESC, "email"', values: [] }
 
 ```

* ##### limit
 
 Will add a **LIMIT** clause.
    
 Parameters: (limit, [offset]) offset can be omitted.

 Returns: itself.

 Example:

 ```Javascript
 
 sh
    .select()
    .from('users')
    .limit(10, 3)
    .build() // {text: 'SELECT * FROM "users" LIMIT 10 OFFSET 3', values:[]}
   
 ```

* ##### join 

 Will add a **JOIN** clause.

 Parameters: (table name). 

 Returns: itself.

 Example:

 ```Javascript
 
 sh
    .select()
    .from('users')
    .join('products')
    .on('users.id','"products"."userId"')
    .and('price','>',50)// "on" returns a conditional query builder proxied with the main select builder in the same way as where method
    .build()// { text: 'SELECT * FROM "users" JOIN "products" ON "users"."id" = "products"."userId" AND "price" > 50', values: [] }
 
 ```

 Alternatively, you can pass another builder.

 ```Javascript
 
 sh
    .select()
    .from('users')
    .join({value:sh.select().from('products').where('price','>',50).noop(),as:'high_price_products'})
    .on('users.id','"high_price_products"."userId"')
    .build() //{ text: 'SELECT * FROM "users" JOIN (SELECT * FROM "products" WHERE "price" > 50) AS "high_price_products" ON "users"."id" = "high_price_products"."userId"', values: [] }
 
 ```
 Note: the "noop" method is necessary to revoke the proxy created by the where clause and make sure we actually pass a select builder as argument.

* ##### leftJoin

 Same as **join** but with left join. 

* ##### rightJoin
    
 Same as **join** but with right join.
 
* ##### fullJoin.
    
 Same as **join** but with full join. 
    
### Insert query builder.

Parameters: ([object]) a list of key, value pair to insert.

Returns: an insert query builder.

Example:

```Javascript

sh
    .insert({name:'Laurent',age:29})
    .into('users')
    .build() // { text: 'INSERT INTO "users" ( "name", "age" ) VALUES ( \'Laurent\', 29 )', values: [] }

```

#### Insert query builder API

* ##### into

 Will add the table name of the insert query. It will be done by default if you use the model service.

 Parameters: (table name).

 Returns: itself.

 Example:

 ```Javascript

 sh
    .insert({name:'Laurent',age:29})
    .into('users')
    .build() // { text: 'INSERT INTO "users" ( "name", "age" ) VALUES ( \'Laurent\', 29 )', values: [] }

 // is equivalent to
 Users
   .insert({name:'Laurent',age:29})
   .build()
 
 ```

* ##### value

 Add a key, value to the insert statement.

 Parameters: (key, [value]) if no value is provided the DEFAULT will be used.

 Example:

 ```Javascript
 
 sh
    .insert()
    .into('users')
    .value('name','Laurent')
    .value('age')
    .build() //{ text: 'INSERT INTO "users" ( "name", "age" ) VALUES ( \'Laurent\', DEFAULT )', values: [] }
 
 ```

* ##### returning
 
 Add a **RETURNING** statement to the query.

 Parameters: (property list).

 Example:

 ```Javascript
 
 sh
    .insert({
     name:'Laurent',
     age:29
    })
    .into('users')
    .returning('id', 'name')
    .build() // { text: 'INSERT INTO "users" ( "name", "age" ) VALUES ( \'Laurent\', 29 ) RETURNING "id", "name"', values: [] }
 
 ```

 Note if you use the insert method from the model service, it automatically returns the whole object ('*')

 ```Javascript
 
 Users
    .insert({
     name:'Laurent',
     age:29
   })
    .build() // { text: 'INSERT INTO "users" ( "name", "age" ) VALUES ( \'Laurent\', 29 ) RETURNING *', values: [] }
 
 ```

### Update query builder

Parameters: (table name) the table to update. If you use the service model method, the related table will be automatically added.

Returns: an update query builder.

Example:

```Javascript

sh
    .update('users')
    .set('name','Laurent')
    .build() // { text: 'UPDATE "users" SET "name" = \'Laurent\'', values: [] }

```

Note: when using the service model method, you can directly pass an object map to set.

```Javascript

Users
    .update({name:'Laurent')
    .build() // { text: 'UPDATE "users" SET "name" = \'Laurent\'', values: [] }

```


#### Update query builder API

* ##### set

 Will add a set statement.

 Parameters(key, value ) or (map): either a key,value pair, either an object.

 Returns: itself.

 Example:

 ```Javascript
 
 sh
    .update('users')
    .set('name','Laurent')
    .set('age',29)
    .build() // { text: 'UPDATE "users" SET "name" = \'Laurent\', "age" = 29', values: [] }
  
 // is equivalent to 
  
 sh
    .update('users')
    .set({
        name:'Laurent',
        age:29
    })
    .build()
 
 ```

* ##### where

 Will add a **WHERE** clause.

 Parameters: (leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

 Returns: a [condition query builder](condition-query-builder-if) proxied with the main update builder. You'll be able to chain with conditional builder specific methods but if you use a method of the main update builder, it will fallback to the main update builder and revoke the proxy.

 Example:

 ```Javascript
 
 sh
    .update('users')
    .set('name','what')
    .where('name','laurent')
    .and('age','>',20) // chain with condition builder method
    .build() // { text: 'UPDATE "users" SET "name" = \'what\' WHERE "name" = \'laurent\' AND "age" > 20', values: [] }
 
 ```
    
 alternatively you can pass another builder as operand.

 ```Javascript
 
 sh
    .update('users')
    .set('name','Laurent')
    .where('id','in',sh.select('id').from('users').orderBy('name').limit(10))
    .build() // { text: 'UPDATE "users" SET "name" = \'Laurent\' WHERE "id" in (SELECT "id" FROM "users" ORDER BY "name" LIMIT 10)', values: [] }
 
 ```

 Note: a left operand string is considered as identifier by default whereas the right operand string will be considered as value. So if you want to use an identifier instead, you will need to wrap it with quotes

* ##### from

 Add a **FROM** statement to the query (ideal if you want to add conditions on other tables).

 Parameters:(table name list).

 Returns: itself.

 Example:

 ```Javascript
 
 sh
    .update('employees')
    .set('sales_count', 1000)
    .from('accounts')
    .where('accounts.name', 'Acme Corporation')
    .and('employees.id', '"accounts"."sales_person"')
    .build() // { text: 'UPDATE "employees" SET "sales_count" = 1000 FROM "accounts" WHERE "accounts"."name" = \'Acme Corporation\' AND "employees"."id" = "accounts"."sales_person"', values: [] }
 
 ```

* ##### returning
 
 Add a **RETURNING** statement to the query.

 Parameters: (property list).

 Example:

 ```Javascript
 
 sh
    .update('users')
    .set({
        name:'Laurent',
        age:29
    })
    .returning('id', 'name')
    .build() // { text: 'UPDATE "users" SET "name" = \'Laurent\', "age" = 29 RETURNING "id", "name"', values: [] }
 
 ```

 Note if you use the update method from the model service, it automatically returns the whole object ('*')

 ```Javascript
 
 Users
    .update()
    .set({
        name:'Laurent',
        age:29
    })
    .build() { text: 'UPDATE "users" SET "name" = \'Laurent\', "age" = 29 RETURNING *', values: [] }
 
 ```

### Delete query builder

Parameters: (table name) the table to update. If you use the service model method, the related table will be automatically added.

Returns: an delete query builder.

Example:

```Javascript

sh
    .delete('users')
    .build() // { text: 'DELETE FROM "users"', values: [] }
  
// is equivalent to

Users
    .delete()
    .build()

```

#### delete query builder API

* ##### where

 Will add a **WHERE** clause.

 Parameters: (leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

 Returns: a [condition query builder]() proxied with the main delete builder. You'll be able to chain with conditional builder specific methods but if you use a method of the main delete builder, it will fallback to the main delete builder and revoke the proxy.

 Example:

 ```Javascript

 sh
    .delete('users')
    .where('name','laurent')
    .and('age','>',20) // chain with condition builder method
    .build() // { text: 'DELETE FROM "users" WHERE "name" = \'laurent\' AND "age" > 20', values: [] }

 ```
    
 alternatively you can pass another builder as operand.

 ```Javascript

 sh
    .delete('users')
    .where('id','in',sh.select('id').from('users').orderBy('name').limit(10))
    .build() // { text: 'DELETE FROM "users" WHERE "id" in (SELECT "id" FROM "users" ORDER BY "name" LIMIT 10)', values: [] }

 ```

 Note: a left operand string is considered as identifier by default whereas the right operand string will be considered as value. So if you want to use an identifier instead, you will need to wrap it with quotes

* ##### using

 Will add the **USING** clause (ideal if you want to use other tables in your condition).

 Parameters: (table name list).

 Returns: itself.

 Example:

 ```Javascript

 sh
    .delete('films')
    .using('producers')
    .where('producer_id', '"producers"."id"')
    .and('producers.name', 'foo')
    .build() // { text: 'DELETE FROM "films" USING "producers" WHERE "producer_id" = "producers"."id" AND "producers"."name" = \'foo\'', values: [] }

 ``` 

### Condition query builder (if)

The condition query builder is most of the time used as a parameter for another builder.

Parameters:(leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

Returns: a conditional builder.

Example:

```Javascript

sh
    .if('name','Laurent')
    .build() //{ text: '"name" = \'Laurent\'', values: [] }

```

Note: any operand can be replaced by another bulder to combine/nest conditions.

#### Condition query builder API 

* ##### and

 Add an **AND** part to a condition.

 Parameters:(leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

 Returns: itself.

 Example:

 ```Javascript

 sh
    .if('age','>',50)
    .and('name', 'ilike', '%Lau%')
    .build() // { text: '"age" > 50 AND "name" ilike \'%Lau%\'', values: [] }

 ```

* ##### or

 Add a **OR** part to a condition.

 Parameters:(leftOperand,[operator],rightOperand) if no operator is provided the default '=' operator is used.

 Returns: itself.

 Example:

 ```Javascript

 sh
    .if('age','>',50)
    .or('name', 'ilike', '%Lau%')
    .build() // { text: '"age" > 50 OR "name" ilike \'%Lau%\'', values: [] }

 ```

### Query with parameters

> is ship-hold safe from sql injections ?

Of course **NOT**.

As any software which deals with SQL database, it can be victim of [SQL injection](). We therefore recommend you to read and review the source code to avoid such attack.

However ship-hold can help you to protect yourself against sql injection by using queries with parameters.

you can pass values as parameters using the syntax '$myValue' and then use an Object to give the value of the different parameters in you "build" method (or "run", "stream" etc)

```Javascript

Users
    .select()
    .where('age','>',20)
    .build() // {text: 'SELECT * FROM "users" WHERE "age" > 20', values:[]}
    
Users
    .select()
    .where('age','>','$age')
    .and('name','$laurent')
    .build({age:20, laurent:'Laurent'}) // {text: 'SELECT * FROM "users" WHERE "age" > $1 AND "name" = $2', values:[20,'Laurent']}

```

## Query runner and API adapters

All the builders (whether they are created from the ship-hold instance or from the model services) are extended with a query runner which will let you communicate with the database system and parse the response into structured JSON objects.

Assuming we have the following data set: 

id | name | email | age
---|------|-------|----
1|Laurent|laurent34azerty@gmail.com|29
2|Blandine|foo@bar.com|29
3|Jesus|jc@heaven.com|2016

The basic runner provides a streaming API based on generator as consumer (I recommend the [very good book](http://exploringjs.com/) from [Axel Raushmayer](http://www.2ality.com/)) which will let you get the data as fast as possible
and compose around it to [build adapters](extend-query-runner-with-more-adapters) following any paradigm you wish.

### Query runner API
 
* #### stream

 Parameters: (parametersObject, sink) parametersObject will be an object whose properties will be used for [query with parameters](query-with-parameters). sink will be a generator as data consumer
 
 Example:
 
 ```javascript
 
 sh
    .select()
    .from('users')
    .where('age','$age')
    .stream({age:29}, function * (){
        const start = Date.now();
        try {
           while (true) {
             const row = yield;
             console.log(row)
           }
         } catch (e) {
           console.error(e)
         } finally {
           console.log('done in %s',Date.now()-start);
         }
    });
 // { id:1, name:'Laurent', email:'laurent34azerty@gmail.com',age:29 }  
 // { id:2, name:'Blandine', email:'foo@bar.com',age:29 }  
 // done in 17ms  
 
 ```
 
* #### run

 The query runner comes with a convenient built in **Promise** adapter.

 Note: the rows are therefore buffered, and the Promise api could be "less efficient" than the streaming api.

 Parameters: (parametersObject) parametersObject will be an object whose properties will be used for [query with parameters](query-with-parameters).

 Returns: a Promise which will resolve the rows as an array (or empty array)

 Example:

 ```javascript
 
 Users
    .select()
    .where('age','$age')
    .run({age:29})
    .then(function(rows){
        console.log(rows);
    });
  // [{ id:1, name:'Laurent', email:'laurent34azerty@gmail.com',age:29 }, { id:2, name:'Blandine', email:'foo@bar.com',age:29 }]  
 
  ```
 
  

 
 
 



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

## Extend ship-hold

As mentioned before, ship-hold comes with a limited set of features. However it can easily be extended with other modules using traditional javascript patterns so that you can combine single purposed modules together and build your framework a la carte.

### Extend all the services by modifying the service prototype.

You can add method to the shared service prototype (mixin with prototype) so all the services will benefits from the extension.

```Javascript

// assuming you have already defined your models (Users, Products, etc)

//extension.js
module.exports = function (sh, options = {}){
  const modelNameList = sh.models();
  const servicePrototype = Object.getPrototypeOf(sh.model(modelNameList[0]);
  
  Object.assign(servicePrototype,{
    findById(id){
        return this
            .select()
            .where(this.primaryKey,'$id')
            .run({id});
    }
  });
  
  return sh;  
}


// then, anywhere in your app

Products
    .findById(34)
    .then(product => {});

Users
    .findById(66)
    
//etc    

```

### Extend a given service

You can use the same technique (mixin on instance) on a particular service so only this particular service will benefit from the extension

```Javascript

// assuming you have already defined your models (Users, Products, etc)

//extension.js
module.exports = function (sh ,options ={}){
  const modelNameList = sh.models();
  const service = sh.model('Users');
  
  Object.assign(service,{
    sendEmail(email, content){
        return this
            .select('email','id')
            .where('email','$email')
            .run({email})
            .then(user => {
            /* send email ... return Promise */
            });
    }
  });
  return sh;  
}


// then, anywhere in your app

Users
    .sendEmail('laurent34azerty@gmail.com','Hello boy!')
    .then(result => {
      //
    })

Products.sendEmail() // undefined is not a function 

```

### Decorate a builder

In the same way you can decorate the builders factory to extend a given builder prototype for example.

```Javascript

// assuming you have already defined your models (Users, Products, etc)

//extension.js
module.exports = function (sh ,options ={pageSize:25}){
    const models = sh.models();
    const proto = Object.getPrototypeOf(sh.model(models[0]));
    const select = proto.select;
    
    Object.assign(proto, {
      select(){
        const builder = select.call(this, ...arguments);
        return Object.assign(builder, {
          page(pageNumber = 1, pageSize = options.pageSize){
            return this.limit(pageSize, (pageNumber - 1) * pageSize);
          }
        });
      }
    });
    
    return sh;
}


// then, anywhere in your app

Users
    .select()
    .page(4)
    .run()

Products
    .select()
    .page(3)
    .run();
```


### Extend query runner with more adapters

This is probably the most powerful as it let you transform query runner into whatever api you need/like

You are a [Rx.js](https://github.com/Reactive-Extensions/RxJS) guy:

```javascript
//extension.js
const Rx = require('rx');

module.exports = function (sh ,options ={pageSize:25}){
 Object.assign(sh.adapters, {
   observable: function (params = {}) {
     return Rx.Observable.create(observer => {
       this.stream(params, function * () {
         try {
           while (true) {
             const row = yield;
             observer.onNext(row);
           }
         } catch (e) {
           observer.onError(e);
         } finally {
           observer.onCompleted();
         }
       })
     });
   }
 });
}


// then, anywhere in your app

Users
    .select()
    .observable()
    .pluck('age')
    .map(age => console.log(age))

Products
    .select()
    .observable()
    .pluck('price')
    .map(price=>Math.floor(price))
```

Want to have a test harness api ? 

```javascript
//extension.js
module.exports = function (sh ,options ={pageSize:25}){
 Object.assign(sh.adapters, {
   test(params = {}, assertions, expected) {
         this.stream(params, function * () {
           try {
             while (true) {
               const row = yield;
               assertions.deepEqual(row, expected.shift());
             }
           } catch (e) {
             assertions.fail(e);
           }
           finally {
             sh.stop();
             assertions.end();
           }
         });
       }
 });
}

// then, anywhere in your app

const test = require('tape')

test('select', t=>{
  Users
    .select('id','name')
    .where(id,1)
    .test({},t,[{id:1,name:'Laurent'}]);
});

```

Want logging api ?
 
```javascript
//extension.js
module.exports = function (sh ,options ={pageSize:25}){
 Object.assign(sh.adapters, {
   logAndTime(params = {}) {
         const start = Date.now();
         this.stream(params, function * () {
           try {
             while (true) {
               const row = yield;
               console.log(row);
             }
           } catch (e) {
             console.log(e);     
           }
           finally {
             console.log('DONE %s in ms', Date.now() - start);
           }
         });
       }
 });
}

// then, anywhere in your app

Users
  .select('id','name')
  .where('id',1)
  .logAndTime();

// {id:1, name:'Laurent'}
// DONE in 21 ms

```

### List of extension modules

Here is a list of existing extensions. Please don't hesitate to make a pull request on this documentation to add yours. It is recommended to add the ship-hold key word in the package.json file of your extension.

* [ship-hold-dao](https://github.com/zorro-del-caribe/ship-hold-dao): makes ship-hold return model instances (with behaviour) rather than plain javascript object
* [ship-hold-uuids](https://github.com/zorro-del-caribe/ship-hold-uuids): automatically generate uuid for id fields
* [ship-hold-migration](https://github.com/zorro-del-caribe/ship-hold-migration): manage and persist database migrations
* [ship-hold-extension-loader](https://github.com/zorro-del-caribe/ship-hold-extension-loader): automatically load ship-hold extensions based on convention
* [ship-hold-model-loader](https://github.com/zorro-del-caribe/ship-hold-model-loader): automatically load models based on convention




## Performances

As very light and using stream as base component, ship-hold performs quite well. There is a [benchmark repository](https://github.com/zorro-del-caribe/ship-hold-benchmark) you can clone and modify to test with you own use cases and hardware which test ship-hold and other libraries in "realistic" use cases.
As any benchmark, it has to be taken with a grain of salt and you should do your own testing before making any claim !
 
### sample result
 
#### Data set

The database created by the fixture script is made of two tables: Users and Products (Users has many products and a product belongs to a user).
There will be 100 000 users and 300 000 products

#### tests

// todo add time to first byte and memory usage ... probably more meaningful when streaming

1. ##### fetch first page
   
   read repeat [ITERATIONS] times "SELECT * FROM users WHERE age > (random) ORDER BY name LIMIT [PAGESIZE]", wait [BREATH] ms and output response time (average, median, best, worst)

   ###### Sample result (for iterations = 200, pageSize=50, breath = 1000)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|25.41|46|14|26
   ship-hold(promise)|24.87|50|13|24
   bookshelf|26.48|75|13|26
   sequelize|27.62|87|15|27
   
2. ##### fetch page including products
   
   same as test 1 but including products 
    
   ###### Sample result (for iterations = 100, pageSize=50, breath = 1000)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|47.26|85|44|46
   ship-hold(promise)|48.57|84|44|47
   bookshelf|48.01|102|42|46
   sequelize|56.43|128|50|55
    
3. ##### get all users

   Load the 100 000 users

   ###### Sample result
   
   framework | response time(ms) 
   ----------|------------------
   ship-hold|811
   ship-hold(promise)|1043
   bookshelf|5756
   sequelize|3309
   



 
 
 
 
 
## sample application

There is a whole [blog application](https://github.com/zorro-del-caribe/ship-hold-sample) build with ship hold, so you can see an almost real world example.

More details coming soon...




## contributing

Please before you submit an issue or a pull request, make sure you fulfill the following requirements.

### Issue

1. [ ] I have provided a description of the issue in English
2. [ ] I have specified the version of ship-hold I use.
3. [ ] my issue is a **bug report** or a **feature request**. Please **NO QUESTION** use stackoverflow or the chat (Preferably stackoverflow so the question can be indexed by search engines: ping me by mail whit your SO question link until I have enough reputation to create a tag)
4. [ ] If it is an issue, provide your models, the sql query (you can use the DEBUG=ship-hold env var to print the query) and the expected sql query if you know it.
5. [ ] If it is an issue, provide a small data set and the expected result.
6. [ ] If it is a feature request: keep in mind that ship-hold favors extension module architecture over monolithic module. So your feature request will likely be refused. Don't hesitate to open it though so it may be open to upvote. However, It is not democracy :) !

### pull request

1. [ ] unless it deals with documentation only, pull request must reference an open issue so we can discuss it before any implementation is done.
2. [ ] include the referenced issue
3. [ ] add tests !
4. [ ] update doc if required (not the readme.md but in the doc folder)

Don't forget to have a look at the tests, there are plenty of examples there !


Made with love in Cuba!

