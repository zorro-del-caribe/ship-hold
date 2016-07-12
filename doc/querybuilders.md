## Query builders

Ship-hold is built around few sql query builders for regular database operations (SELECT, INSERT, UPDATE, DELETE). You can access them from the shiphold instance itself of from the different [model services]() (in this case the builders will be bound to the table related to the model service).
All the query builders have a **build** method which will return an object with the sql statement as the **text** property and the [parameters values]() as the **values** property. This is only string manipulation so you don't need a
real database connection to use the build method.

Note: query builders are extended with [query runner]() which will allow you to run the query (and parse the response) against a real database.

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

#### SELECT QUERY BUILDER API
    
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

 Returns: a [condition query builder]() proxied with the main select builder. You'll be able to chain with conditional builder specific methods but if you use a method of the main select builder, it will fallback to the main select builder and revoke the proxy.

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

#### SELECT QUERY BUILDER API

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

 Returns: a [condition query builder]() proxied with the main update builder. You'll be able to chain with conditional builder specific methods but if you use a method of the main update builder, it will fallback to the main update builder and revoke the proxy.

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