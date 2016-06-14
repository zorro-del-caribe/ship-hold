const pg = require('pg');
const connection = 'postgres://docker:docker@192.168.99.100:5432/ship-hold-test';
const test = require('tape');
const shiphold = require('../../shiphold');

let userFixture;
let productFixture;

function getUsers () {
  return userFixture.map(u=>Object.assign({}, u));
}

function getProducts () {
  return productFixture.map(u=>Object.assign({}, u));
}

function createModels () {
  const sh = shiphold({
    hostname: '192.168.99.100',
    username: 'docker',
    password: 'docker',
    database: 'ship-hold-test'
  });

  const Users = sh.model('Users', function (h) {
    return {
      table: 'users_association_select',
      columns: {
        id: 'integer',
        age: 'integer',
        name: 'string'
      },
      relations: {
        products: h.hasMany('Products'),
        phone: h.hasOne('Phones'),
        accounts: h.belongsToMany('Accounts', 'UsersAccounts', 'user_id')
      }
    };
  });

  const Products = sh.model('Products', function (h) {
    return {
      table: 'products_association_select',
      columns: {
        id: 'integer',
        sku: 'string',
        title: 'string',
        price: 'double',
        user_id: 'integer'
      },
      relations: {
        owner: h.belongsTo('Users', 'user_id')
      }
    };
  });

  const Phones = sh.model('Phones', function (h) {
    return {
      table: 'phones_association_select',
      columns: {
        id: 'integer',
        number: 'string',
        user_id: 'integer'
      },
      relations: {
        human: h.belongsTo('Users', 'user_id')
      }
    };
  });

  const Accounts = sh.model('Accounts', function (h) {
    return {
      table: 'accounts_association_select',
      columns: {
        id: 'integer',
        balance: 'double'
      },
      relations: {
        owners: h.belongsToMany('Users', 'UsersAccounts', 'account_id')
      }
    };
  });

  const UsersAccount = sh.model('UsersAccounts', function (h) {
    return {
      table: 'users_accounts_association_select',
      columns: {
        id: 'integer',
        user_id: 'integer',
        account_id: 'integer'
      }
    };
  });

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

  return {Users, Products, Phones, Accounts};
}

test('add users fixture', t=> {
  pg.connect(connection, function (err, client, done) {
    const query = `INSERT INTO users_association_select(name, age) 
      VALUES 
      ('Laurent',29),
      ('Jesus', 2016),
      ('Raymond',55),
      ('Blandine',29),
      ('Olivier',31),
      ('Francoise',58)
      RETURNING *`;

    client.query(query, function (err, result) {
      t.error(err);
      t.equal(result.rows.length, 6);
      userFixture = result.rows;
      done();
      t.end();
    });
  });
});

test('add products fixture', t=> {
  pg.connect(connection, function (err, client, done) {
    const query = `INSERT INTO products_association_select(price, sku,title,user_id) 
      VALUES 
      (9.99,'sgl','sun glasses',2),
      (49.5,'kbd','key board',1),
      (20,'sbg','small bag',1),
      (25.99,'sht','shirt',NULL),
      (99.9,'wdr','white dress',4),
      (5.75,'tdb','teddy bear',NULL)
      RETURNING *`;

    client.query(query, function (err, result) {
      t.error(err);
      t.equal(result.rows.length, 6);
      productFixture = result.rows;
      done();
      t.end();
    });
  });
});

test('add phones fixture', t=> {
  pg.connect(connection, function (err, client, done) {
    const query = `INSERT INTO phones_association_select(number,user_id) 
      VALUES ('123456789',1) RETURNING *`;
    client.query(query, function (err, result) {
      t.error(err);
      t.equal(result.rows.length, 1);
      done();
      t.end();
    });
  });
});

test('add accounts fixture', t=> {
  pg.connect(connection, function (err, client, done) {
    const query = `INSERT INTO accounts_association_select(balance) VALUES 
    (200.42), 
    (-20.56) 
    RETURNING *`;
    const pivotq = `INSERT INTO users_accounts_association_select(user_id,account_id) VALUES 
    (1,1),
    (1,2)
      RETURNING *
    `;
    client.query(query, function (err, result) {
      t.error(err);
      t.equal(result.rows.length, 2);
      client.query(pivotq, function (err, result) {
        t.error(err);
        t.equal(result.rows.length, 2);
        done();
        t.end();
      })
    });
  });
});

test('one to many: load all users with their products', t=> {
  const {Users, Products} = createModels();
  Users
    .select()
    .orderBy('id')
    .include('products')
    .test({}, t, [
      Object.assign({}, getUsers()[0], {products: getProducts().filter(p=>p.user_id === 1)}),
      Object.assign({}, getUsers()[1], {products: getProducts().filter(p=>p.user_id === 2)}),
      Object.assign({}, getUsers()[2], {products: []}),
      Object.assign({}, getUsers()[3], {products: getProducts().filter(p=>p.user_id === 4)}),
      Object.assign({}, getUsers()[4], {products: []}),
      Object.assign({}, getUsers()[5], {products: []})
    ])
});

test('one to many: specify fields', t=> {
  const {Users, Products} = createModels();
  Users
    .select('id', 'name')
    .orderBy('id')
    .include('products.sku', 'products.id')
    .test({}, t, [
      {name: 'Laurent', id: 1, products: [{sku: 'kbd', id: 2}, {id: 3, sku: 'sbg'}]},
      {name: 'Jesus', id: 2, products: [{sku: 'sgl', id: 1}]},
      {name: 'Raymond', id: 3, products: []},
      {name: 'Blandine', id: 4, products: [{sku: 'wdr', id: 5}]},
      {name: 'Olivier', id: 5, products: []},
      {name: 'Francoise', id: 6, products: []}
    ]);
});

test('one to many: filter on target model', t=> {
  const {Users, Products} = createModels();
  Users
    .select('id', 'name')
    .where('name', 'Laurent')
    .include('products.sku', 'products.id')
    .test({}, t, [{id: 1, name: 'Laurent', products: [{sku: 'kbd', id: 2}, {id: 3, sku: 'sbg'}]}]);
});

test('one to many: order and limit on target model', t=> {
  const {Users, Products} = createModels();
  Users
    .select('id', 'name', 'age')
    .where('age', '<', 50)
    .orderBy('name', 'asc')
    .limit(2)
    .include('products.sku', 'products.id')
    .test({}, t, [
      {id: 4, name: 'Blandine', age: 29, products: [{sku: 'wdr', id: 5}]},
      {id: 1, name: 'Laurent', age: 29, products: [{sku: 'kbd', id: 2}, {sku: 'sbg', id: 3}]}
    ]);
});

test('one to many:filter on included model', t=> {
  const {Users, Products} = createModels();
  const u = Users
    .select('id', 'name')
    .where('name', 'Laurent')
    .include('products')
    .where('products.price', '<', 30)
    .test({}, t, [
      {id: 1, name: 'Laurent', products: [{id: 3, sku: 'sbg', price: 20, title: 'small bag', user_id: 1}]}
    ]);
});

test('many to one: load all products with their user', t=> {
  const {Products}=createModels();
  Products
    .select()
    .orderBy('id')
    .include('owner')
    .test({}, t, getProducts().map(p=>Object.assign(p, {owner: getUsers().filter(u=>u.id === p.user_id)[0] || null})));
});

test('many to one: specify fields', t=> {
  const {Products}=createModels();
  const expected = getProducts()
    .map(p=> {
      return {id: p.id, title: p.title, user_id: p.user_id}
    })
    .map(p=> {
      return Object.assign({}, p, {owner: getUsers().filter(u=>u.id === p.user_id)[0] || null});
    });
  for (const p of expected) {
    delete p.user_id;
    if (p.owner) {
      p.owner = {name: p.owner.name, id: p.owner.id}
    }
  }

  Products
    .select('id', 'title')
    .orderBy('id')
    .include('owner.name', 'owner.id')
    .test({}, t, expected)
});

test('many to one: filter on target model', t=> {
  const {Products}=createModels();
  Products
    .select('title', 'id')
    .where('title', 'white dress')
    .include('owner.name', 'owner.id')
    .test({}, t, [{id: 5, title: 'white dress', owner: {id: 4, name: 'Blandine'}}]);
});

test('many to one: order and limit on target model', t=> {
  const {Products}=createModels();
  Products
    .select('id', 'title', 'price')
    .orderBy('price')
    .limit(2)
    .where('price', '<=', 20)
    .include({association: 'owner', attributes: ['name', 'id']})
    .test({}, t, [
      {id: 6, title: 'teddy bear', price: 5.75, owner: null},
      {id: 1, title: 'sun glasses', price: 9.99, owner: {id: 2, name: 'Jesus'}}
    ]);
});

test('include multiple models', t=> {
  const {Users} = createModels();
  Users
    .select('name', 'id')
    .where('id', 1)
    .include('products.title', 'products.id', 'phone.number', 'phone.id')
    .test({}, t, [{
      id: 1,
      name: 'Laurent',
      phone: {id: 1, number: '123456789'},
      products: [{id: 2, title: 'key board'}, {id: 3, title: 'small bag'}]
    }]);
});

test('many to many', t=> {
  const {Users} =createModels();
  Users
    .select('id', 'name')
    .where('id', 1)
    .include('accounts.balance', 'accounts.id')
    .test({}, t, [
      {id: 1, name: 'Laurent', accounts: [{id: 1, balance: 200.42}, {id: 2, balance: -20.56}]}
    ]);
});

test('many to many filter on include', t=> {
  const {Users}=createModels();
  Users
    .select('id', 'name')
    .orderBy('id')
    .include({
      association: 'accounts', where: Users.if('balance', '>', 0)
    })
    .test({}, t, [
      {id: 1, name: 'Laurent', accounts: [{id: 1, balance: 200.42}]},
      {id: 2, name: 'Jesus', accounts: []},
      {id: 3, name: 'Raymond', accounts: []},
      {id: 4, name: 'Blandine', accounts: []},
      {id: 5, name: 'Olivier', accounts: []},
      {id: 6, name: 'Francoise', accounts: []}
    ]);
})
;

test('combo', t=> {
  const {Users}=createModels();
  Users
    .select('id', 'name')
    .where('id', 1)
    .include('products', 'phone', 'accounts')
    .test({}, t, [{
        accounts: [
          {balance: 200.42, id: 1}, 
          {balance: -20.56, id: 2} 
        ],
        id: 1,
        name: 'Laurent',
        phone: {id: 1, number: '123456789', user_id: 1},
        products: [
          {id: 2, price: 49.5, sku: 'kbd', title: 'key board', user_id: 1},
          {
            id: 3,
            price: 20,
            sku: 'sbg',
            title: 'small bag',
            user_id: 1
          }
        ]
      }]
    );
});