const test = require('tape');
const shiphold = require('../../shiphold');
const util = require('../../lib/util');


test('jsonPointer get an existing value', t=> {
  const pointer = util.jsonPointer('foo.bar.woot');
  const actual = pointer.get({foo: {bar: {woot: 'blah'}}});
  const expected = 'blah';
  t.equal(actual, expected);
  t.end();
});

test('jsonPointer get undefined if ther is no value', t=> {
  const pointer = util.jsonPointer('foo.bar.woot');
  const actual = pointer.get({foo: {nope: {woot: 'blah'}}});
  const expected = undefined;
  t.equal(actual, expected);
  t.end();
});

test('jsonPointer set to existing path', t=> {
  const pointer = util.jsonPointer('foo.bar.woot');
  const context = {foo: {bar: {}}};
  pointer.set(context, 'wootVal');
  t.deepEqual(context, {foo: {bar: {woot: 'wootVal'}}});
  t.end();
});

test('jsonPointer set to non exisiting path', t=> {
  const pointer = util.jsonPointer('foo.bar.woot');
  const context = {foo: {}};
  pointer.set(context, 'wootVal');
  t.deepEqual(context, {foo: {bar: {woot: 'wootVal'}}});
  t.end();

});

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