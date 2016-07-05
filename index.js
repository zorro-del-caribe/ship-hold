const shipHold = require('./shiphold');

const sh = shipHold({
  hostname: '192.168.99.100',
  username: 'docker',
  password: 'docker',
  database: 'ship-hold-test'
});
//
const Users = sh.model('users', function (sc) {
  return {
    table: 'users',
    columns: {
      id: 'integer',
      age: 'integer',
      name: 'string',
      email: 'string',
      username: 'string',
      country: 'string',
      createdAt: 'date',
      updatedAt: 'date'
    },
    relations: {
      products: sc.hasMany('products')
      // phone: sc.hasOne('phones')
    }
  }
});

const Products = sh.model('products', function (sc) {
  return {
    table: 'products',
    columns: {
      id: 'integer',
      price: 'double',
      title: 'string',
      userId: 'integer',
      sku: 'string',
      stock: 'integer',
      createdAt: 'date',
      updatedAt: 'date'
    },
    relations: {
      user: sc.belongsTo('users', 'userId')
    }
  }
});

Object.assign(sh.adapters, {
  logRows: function (params = {}) {
    const start = Date.now();
    return this.stream(params, function * () {
      try {
        while (true) {
          const row = yield;
          // console.log(row.id);
        }
      } catch (e) {
        console.error(e)
      } finally {
        console.log('DONE ', Date.now() - start, ' ms');
      }
    })
  }
});

const sequelize = require('sequelize');

const seq = new sequelize('postgres://docker:docker@192.168.99.100/ship-hold-test');

const sequelizeUsers = seq.define('users', {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true
  },
  age: sequelize.INTEGER,
  name: sequelize.STRING,
  email: sequelize.STRING,
  username: sequelize.STRING,
  country: sequelize.STRING
});

const sequelizeProducts = seq.define('products', {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true
  },
  sku: sequelize.STRING,
  title: sequelize.STRING,
  stock: sequelize.INTEGER,
  price: sequelize.FLOAT
});

sequelizeProducts.belongsTo(sequelizeUsers);
sequelizeUsers.hasMany(sequelizeProducts);

const start = Date.now();

sequelizeUsers
  .findAll({
    attributes: ['id', 'age', 'username'],
    where: {age: {$gt: 50}},
    // order: ['username'],
    include: [{model: sequelizeProducts, attributes: ['id', 'price']}],
    limit: 300
  })
  .then(r=> {
    console.log('DONE SEQ ', Date.now() - start)
  });


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

// Users
//   .select('id')
//   // .limit()
//   .where('age','>',60)
//   .include('products')
//   .logRows()
// .then(r=>console.log(JSON.stringify(r,null,true)));


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

// const users = Users
//   .select('id', 'age', 'username')
//   .where('age', '>', '$age')
//   .limit('$limit')
//   // .orderBy('username')
//   .include(Products.select('id', 'price'))
//   .logRows({age: 50, limit: 300});


// sh.stop();


// console.log(users)

// Phones
//   .select()
//   .include('owner')
//   .logRows()