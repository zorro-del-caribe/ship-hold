const connectionString = "postgres://docker:docker@192.168.99.100:5432/dev";
const models = require('./lib/model');
const qb = require('ship-hold-querybuilder')

const model = models({table: 'users'}, connectionString);

// const user4 = model
//   .new({id: 4});


setInterval(function () {
  const user4 = model.new({id: 4})
    .fetch('id', 'age', 'name')
    .then(x=>x);
}, 100);

// const User = sf(model);
// model
//   .insert({
//     id: '$id',
//     age: '$age',
//     name: '$age'
//   })
//   .returning('*')
//   .run({id: 7, name: 'ed', age: 16})
//   .then(rows => console.log(rows))
//   .catch(err=>console.log(err));

// model
//   .select()
//   // .where('name', '"users"."age"::text')
//   .run()
//   .then(rows=>console.log(rows))
//   .catch(err=>console.log(err));
