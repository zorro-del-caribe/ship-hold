const shipHold = require('./shiphold');

const sh = shipHold({
  hostname: '192.168.99.100',
  username: 'docker',
  password: 'docker',
  database: 'ship-hold-test'
});

const Users = sh.model('users', function (sc) {
  return {
    table: 'user_simple_select',
    columns: {
      id: 'integer',
      age: 'integer',
      name: 'string'
    },
    // relations: {
    //   products: sc.hasMany('products'),
    //   phone: sc.hasOne('phones')
    // }
  }
});

// const Products = sh.model('products', function (sc) {
//   return {
//     table: 'products',
//     columns: {
//       id: 'integer',
//       price: 'double',
//       title: 'string',
//       userId: 'integer'
//     },
//     relations: {
//       user: sc.belongsTo('users', 'userId')
//     }
//   }
// });
//
// const Phones = sh.model('phones', function (sc) {
//   return {
//     table: 'phones',
//     columns: {
//       id: 'integer',
//       number: 'string',
//       createdAt: 'timestamp',
//       updatedAt: 'timestamp',
//       userId: 'integer'
//     },
//     relations: {
//       owner: sc.belongsTo('users', 'userId')
//     }
//   }
// });

// const sequelize = require('sequelize');

// const seq = new sequelize('postgres://docker:docker@192.168.99.100/dev');
//
// const Users = seq.define('users', {
//   id: {
//     type: sequelize.INTEGER,
//     primaryKey: true
//   },
//   age: sequelize.INTEGER,
//   name: sequelize.STRING
// });
//
// const Products = seq.define('products', {
//   id: {
//     type: sequelize.INTEGER,
//     primaryKey: true
//   },
//   price: sequelize.FLOAT,
//   title: sequelize.STRING
// });
//
// const Phones = seq.define('phones', {
//   number: sequelize.STRING
// });
//
// const Stocks = seq.define('stocks', {
//   quantity: sequelize.INTEGER
// });
//
// const Posts = seq.define('posts', {
//   content: sequelize.TEXT
// });
//
//
// Posts.belongsToMany(Users, {through: 'users_projects'})
// Users.belongsToMany(Posts, {through: 'users_projects'})
//
// Stocks.belongsTo(Products);
// Products.hasMany(Stocks);
//
// Phones.belongsTo(Users);
// Users.hasMany(Phones);
//
// Products.belongsTo(Users);
// Users.hasMany(Products);
//
// Promise.all([Posts.find(), Users.find({attributes:['id','age','name']})])
//   .then(([post, user])=> {
//     return user.addPost(post)
//   })
//   .catch(e=>console.log(e))
//

// const start = Date.now();
// Users.findAll({
//     attributes: ['id', 'name', 'age'],
//     include: [{model: Products, attributes: ['id', 'title', 'price', 'userId']}, Phones]
//   })
//   .then(result=>console.log('DONE ', Date.now() - start, ' ms'))

//
// function mixin (target, behaviour) {
//   Object.assign(Object.getPrototypeOf(target), behaviour);
// }
//
// /**
//  *  SERVICE EXTENSION
//  */
//
// //mixin (every model service: Users, Products etc)
// mixin(Users, {
//   name: function () {
//     return this.table
//   }
// });
// console.log(Users.name()); // users
// console.log(Products.name()); // products
//
// //only Users service
// Object.assign(Users, {foo: ()=>console.log('foo')});
//
// Users.foo(); //foo
// // Products.foo(); => error
//
//
// /**
//  * API ADAPTER EXTENSION
//  */
//
// //api adapter (select, update, insert, delete of every model service)
// Object.assign(sh.adapters, {
//   logRows: function (params = {}) {
//     return this.stream(params, function * () {
//       while (true) {
//         const row = yield;
//         console.log(row);
//       }
//     })
//   }
// });
//
// Users
//   .select()
//   .logRows();
//
// Users
//   .update()
//   .where('id', '$id')
//   .set('age', '$age')
//   .returning('*')
//   .logRows({age: Math.ceil(Math.random() * 100), id: 1});
//
//
// /**
//  * MODEL INSTANCE EXTENSION
//  */
//
// //(every user instance, but not products etc..)
// const user = Users.new({id: 5});
// mixin(user, {
//   test: function () {
//     console.log(this);
//   }
// });
// const user2 = Users.new({id: 666});
// const product = Products.new({id: 666});
//
// user.test();
// user2.test();
// // product.test(); => error
//
//
// /**
//  * SINGLETONS REGISTRY
//  */
// console.log('Same %s', Users === sh.model('users')); // true


//////////////////////////////////////////////////////////////////////////////////


//api adapter(select, update, insert, delete of every model service)

Object.assign(sh.adapters, {
  logRows: function (params = {}) {
    const start = Date.now();
    return this.stream(params, function * () {
      try {
        while (true) {
          const row = yield;
          console.log(row);
        }
      } catch (e) {
        console.error(e)
      } finally {
        console.log('DONE ', Date.now() - start, ' ms');
      }
    })
  }
});

// const Rx = require('rx');

// Object.assign(sh.adapters, {
//   observable: function (params = {}) {
//     return Rx.Observable.create(observer => {
//       this.stream(params, function * () {
//         try {
//           while (true) {
//             const row = yield;
//             observer.onNext(row);
//           }
//         } catch (e) {
//           observer.onError(e);
//         } finally {
//           observer.onCompleted();
//         }
//       })
//     });
//   }
// });
//
// const products = Products
//   .select()
//   .include('user')
//   .logRows();

const users = Users
  .select()
  .where('age', '>', 30)
  .and('name','!=','Jesus')
  .run({age: 30});


sh.stop();


// console.log(users)

// Phones
//   .select()
//   .include('owner')
//   .logRows()