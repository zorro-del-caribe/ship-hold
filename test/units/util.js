const test = require('zora');
const {default:shiphold} = require('../../src-old/shiphold');
const util = require('../../src-old/lib/util');

function createDefaultModels(sh) {
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

test('normalize include specifications', t => {
	const sh = shiphold();
	const {Users, Projects} = createDefaultModels(sh);
	const normalized = util.normalizeInclude(Users.definition, sh, Projects);
	const relation = normalized[0].relation;
	t.equal(relation.as, 'user_projects');
	t.deepEqual(relation.attributes, Object.keys(Projects.definition.columns));
	t.equal(relation.asCollection, true);
});
