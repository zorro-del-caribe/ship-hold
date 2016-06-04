const shipHold = require('./shiphold');

const sh = shipHold({
  hostname: '192.168.99.100',
  username: 'docker',
  password: 'docker',
  database: 'dev'
});

const Users = sh.model('users', {
  table: 'users',
  columns: {
    id: 'integer',
    age: 'integer',
    name: 'string'
  }
});

const Products = sh.model('products', {
  table: 'products',
  columns: {
    id: 'integer',
    price: 'double',
    title: 'string',
    userId: 'integer'
  }
});

// const sequelize = require('sequelize');
//
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
// Products.belongsTo(Users);
// Users.hasMany(Products);
//
// Products
//   .findAll({
//     // order:[['id','ASC']],
//     // limit:1,
//     include:[{model:Users,attributes:['name','age','id']}],
//     attributes:['price','id','title']
//   })
//   .then(result=>console.log(result.map(r=>r.dataValues)))


// var knex = require('knex')({
//   client: 'postgres',
//   connection: {
//     host: '192.168.99.100',
//     user: 'docker',
//     password: 'docker',
//     database: 'dev',
//     charset: 'utf8'
//   }
// });
//
// var bookshelf = require('bookshelf')(knex);
//
// var Users = bookshelf.Model.extend({
//   tableName: 'users',
//   products: function () {
//     return this.hasMany(Products)
//   }
// });
//
// var Products = bookshelf.Model.extend({
//   tableName: 'products',
//   user: function () {
//     return this.belongsTo(Users);
//   }
// });
// //
// Users
//   // .query()
//   .fetchAll()
//   .then(function (res) {
//     console.log(res);
//   })


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
Object.assign(sh.adapters, {
  logRows: function (params = {}) {
    return this.stream(params, function * () {
      while (true) {
        const row = yield;
        console.log(row);
      }
    })
  }
});
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


// api adapter (select, update, insert, delete of every model service)
// Object.assign(sh.adapters, {
//   logRows: function (params = {}) {
//     return this.stream(params, function * () {
//       try {
//         while (true) {
//           const row = yield;
//           console.log(row);
//         }
//       } catch (e) {
//         console.error(e)
//       } finally {
//         console.log('DONE');
//       }
//     })
//   }
// });

const Rx = require('rx');

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
//
// // const u= Users.new({id:1})
// //   .fetch()
// //   .then(r=>console.log(r))
//
const userQ = Users
  .select( 'name')
  .include('products.title')
  .logRows();

// console.log(userQ);


