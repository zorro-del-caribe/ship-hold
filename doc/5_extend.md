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