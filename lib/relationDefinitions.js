const createEmptyObject = function () {
  return {};
};

function relation (name, asCollection = false, fn = createEmptyObject) {
  return function (model, ...args) {
    return Object.assign({}, fn(...args), {relation: name, model, asCollection});
  };
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
  belongsToMany: relation('belongsToMany', true, function (through, referenceKey) {
    if (!through) {
      throw new Error('when using the relation "belongsToMany", you must specify a through model');
    }
    return {through, referenceKey};
  })
};
