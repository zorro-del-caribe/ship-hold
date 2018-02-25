const createEmptyObject = () => ({});

const relation = (relation, asCollection = false, fn = createEmptyObject) => (model, ...args) => Object.assign({}, fn(...args), {
	relation,
	model,
	asCollection
});

module.exports = {
	belongsTo: relation('belongsTo', false, (foreignKey) => {
		if (!foreignKey) {
			throw new Error('when using the relation "belongsTo", you must specify a foreignKey');
		}
		return {
			foreignKey
		};
	}),
	hasOne: relation('hasOne'),
	hasMany: relation('hasMany', true),
	belongsToMany: relation('belongsToMany', true, (through, referenceKey) => {
		if (!through) {
			throw new Error('when using the relation "belongsToMany", you must specify a through model');
		}
		return {through, referenceKey};
	})
};
