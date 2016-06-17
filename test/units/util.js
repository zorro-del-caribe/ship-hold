const test = require('tape');
const shiphold = require('../../shiphold');
const util = require('../../lib/util');

// function createDefaultModels (sh) {
//   const Users = sh.model('Users', function (s) {
//     return {
//       table: 'users',
//       columns: {id: 'integer', name: 'string', age: 'integer'},
//       relations: {
//         projects: s.hasMany('Projects')
//       }
//     };
//   });
//
//   const Projects = sh.model('Projects', function (s) {
//     return {
//       table: 'projects',
//       columns: {},
//       relations: {
//         owner: s.belongsTo('Users', 'userId')
//       }
//     };
//   });
//   return {Users, Projects};
// }
//
// test('normalize include specifications', t=> {
//   const sh = shiphold();
//   const {Users, Projects} = createDefaultModels(sh);
//   const associations = util.normalizeInclude(Users.definition, sh, ['projects']);
//   t.deepEqual(associations, [{
//       asCollection: true,
//       association: 'projects',
//       attributes: [],
//       model: 'Projects',
//       relation: 'hasMany'
//     }]
//   );
//   t.end();
// });
//
// test('normalize include specifications', t=> {
//   const sh = shiphold();
//   const {Users, Projects} = createDefaultModels(sh);
//   const associations = util.normalizeInclude(Projects.definition, sh, ['owner.id', 'owner.name']);
//   t.deepEqual(associations, [{
//       asCollection: false,
//       association: 'owner',
//       attributes: ['id', 'name'],
//       foreignKey: 'userId',
//       model: 'Users',
//       relation: 'belongsTo'
//     }]
//   );
//   t.end();
// });

// test('tree', t=> {
//   const tree = util.tree('foo', 'bar');
//   tree.add(util.tree('blah', 'woot'));
//   const vals = [...tree];
//   t.deepEqual(vals,['sdf'])
//   // t.end();
//
// });