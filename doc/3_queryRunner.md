## Query runner and API adapters

All the builders (whether they are created from the ship-hold instance or from the model services) are extended with a query runner which will let you communicate with the database system and parse the response into structured JSON objects.

Assuming we have the following data set: 

id | name | email | age
---|------|-------|----
1|Laurent|laurent34azerty@gmail.com|29
2|Blandine|foo@bar.com|29
3|Jesus|jc@heaven.com|2016

The basic runner provides a streaming API based on generator as consumer (I recommend the [very good book]() from @Axel) which will let you get the data as fast as possible
and compose around it to [build adapters]() following any paradigm you wish.

### Query runner API
 
* #### stream

 Parameters: (parametersObject, sink) parametersObject will be an object whose properties will be used for [query with parameters](). sink will be a generator as data consumer
 
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

 Parameters: (parametersObject) parametersObject will be an object whose properties will be used for [query with parameters]().

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

 
 
 



