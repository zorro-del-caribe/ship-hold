const test = require('zora');
const shiphold = require('../../src/shiphold');
const util = require('../../src/lib/util');

function createDefaultModels (sh) {
  const Users = sh.model('Users', function (s) {
    return {
      table: 'users',
      columns: {id: 'integer', name: 'string', age: 'integer'},
      relations: {
        user_projects: s.hasMany('Projects')
      }
    };
  });

  const Projects = sh.model('Projects', function (s) {
    return {
      table: 'projects',
      columns: {
        title: 'string',
        progress: 'integer',
        deadline: 'date'
      },
      relations: {
        owner: s.belongsTo('Users', 'userId')
      }
    };
  });
  return {Users, Projects};
}

test('normalize include specifications', t=> {
  const sh = shiphold();
  const {Users, Projects} = createDefaultModels(sh);
  const [{relation}] = util.normalizeInclude(Users, [Projects]);
  t.equal(relation.as, 'user_projects');
  t.deepEqual(relation.attributes, Projects.columns);
  t.equal(relation.pointer, 'user_projects.id');
  t.equal(relation.asCollection, true);
  t.deepEqual(relation.nested, []);
});