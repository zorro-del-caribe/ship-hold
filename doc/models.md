## Models

ship-hold lets you define models so you'll have services with convenient api to query a given type of data. It is also useful to define the relations between your models
and give you the ability to eagerly load dependant model instances without the trouble of writing sophisticated sql join queries. Finally, services can easily be [extended]() to provide
an api that fits better your need

### define a model

Use the **model** method on the ship-hold instance

#### model method

Parameters: (modelName, [definitionFunction]): the modelName is the key used to register a given model, the definition function is a function which has to return
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
Note: the columns object must declare all the properties as key, what you put as value does not really matter. It may depend on conventions extension modules use for
validation, etc

If you omit the definitionFunction the **model** method becomes a getter to retrieve the model service. All services are singletons.

```javascript
sh.model('Users') === sh.model('Users') // true (same object)
```

### relations definition

The definition function has a relation helper as firts argument, to let you define the relation between your models.

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
           owner:h.BelongsTo('Users', 'userId') // target model name, and foreign key which references the User (as owner)
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
 
 Assuming a user has many bank accounts and a bank accounts can belongs to many users. The mapping being done by a join table "users_accounts".
 
 
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
           owners:h.BelongsToMany('Users','UsersAccounts,'accountId') // target model name, model name for the join table, column which references accounts in the join table
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
