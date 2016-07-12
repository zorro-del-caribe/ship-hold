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

Users //

Products // undefined is not a function 

```


### Extend query runner with more adapters

### Extend an extension !

### List of extension modules

Here is a list of existing extensions. Please don't hesitate to make a pull request on this documentation to add yours. It is recommended to add the ship-hold key word in the package.json file of your extension.

* [ship-hold-dao](https://zorro-del-caribe/ship-hold-dao): makes ship-hold return model instances (with behaviour) rather than plain javascript object 