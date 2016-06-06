function relation (name, asCollection = false, fn = function () {
  return {};
}) {
  return function (model, ...args) {
    return Object.assign({}, fn(...args), {relation: name, model, asCollection});
  }
}

module.exports = {
  belongsTo: relation('belongsTo', false, function (foreignKey) {
    if (!foreignKey) {
      throw new Error('when using the relation "belongsTo", you must specify a foreignKey');
    }
    return {
      foreignKey
    };
  }),
  hasOne: relation('hasOne'),
  hasMany: relation('hasMany', true),
  belongsToMany(model, through){
  }
};