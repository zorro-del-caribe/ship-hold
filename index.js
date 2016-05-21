const connectionString = "postgres://docker:docker@192.168.99.100:5432/dev";
const models = require('./lib/model');
const qb = require('ship-hold-querybuilder');

const model = models({
  table: 'users', columns: {
    id: 'integer',
    age: 'integer',
    name: 'string'
  }
}, connectionString);

const newUSer=model
  .new({id:777,name:'blah',age:1})
  .save()
  .then(r=>console.log(r))
  .catch(e=>console.log(e));

// model.select()
//   .run()
//   .then(res=> {
//       console.log(res)
//   })


// const user666 = model.new({id: 666})
//   .fetch()
//   .then(result=>console.log(result));




