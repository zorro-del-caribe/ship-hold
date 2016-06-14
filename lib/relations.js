function relation (name, asCollection = false, fn = function () {
  return {};
}) {
  return function (model, ...args) {
    return Object.assign({}, fn(...args), {relation: name, model, asCollection});
  }
}

exports.definitions = {
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

const selectFields = {
  selectFields(){
    const def = this.definition;
    return def.attributes.map(attr=> {
      return {
        value: [def.association, attr].join('.'),
        as: `"${def.association}.${attr}"`
      }
    });
  }
};

const manyToMany = Object.assign({}, selectFields, {
  //works on side effects ...
  join(builder, where){
    const definition = this.definition;
    const sourceModelDef = this.model.definition;

    const targetModel = this.sh.model(definition.model);
    const targetModelDef = targetModel.definition;

    const pivotModel = this.sh.model(this.definition.through);
    const sourceKeyOnPivot = sourceModelDef.relations[definition.association].referenceKey;

    const getTargetPivotKey = () => {
      const modelList = this.sh.models();
      const sourceModelName = modelList.find(m=>this.sh.model(m) === this.model);
      const relation = Object.keys(targetModelDef.relations).find(rel=>targetModelDef.relations[rel].model === sourceModelName);
      return targetModelDef.relations[relation].referenceKey;
    };

    const targetKeyOnPivot = getTargetPivotKey(this.sh);

    const pivotSelect = [sourceKeyOnPivot, targetKeyOnPivot].map(key=> {
      return {
        value: [pivotModel.table, key].join('.'),
        as: `"${definition.through}.${key}"`
      };
    });
    const allSelect = pivotSelect.concat(targetModel.table + '.*');
    const pivotLeftOperand = [pivotModel.table, targetKeyOnPivot].join('.');
    const pivotRightOperand = `"${targetModel.table}"."${targetModel.primaryKey}"`;

    let pivot = pivotModel
      .select(...allSelect);

    if (where) {
      pivot = pivot.where(where).noop();
    }

    pivot = pivot
      .join(targetModel.table)
      .on(pivotLeftOperand, pivotRightOperand)
      .noop();

    const leftOperand = [sourceModelDef.table, this.model.primaryKey].join('.');
    const rightOperand = `"${definition.association}"."${definition.through}.${sourceKeyOnPivot}"`;
    return builder
      .leftJoin({value: pivot, as: definition.association})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

const oneToMany = Object.assign({}, selectFields, {
  join(builder, where){
    let outputBuilder = builder;
    const definition = this.definition;
    const targetModel = this.sh.model(definition.model);
    const sourceModel = this.model;
    const leftOperand = [sourceModel.definition.table, sourceModel.primaryKey].join('.');
    const getForeignKey = () => {
      const modelList = this.sh.models();
      const sourceModelName = modelList.find(m=>this.sh.model(m) === sourceModel);
      const targetDefinition = targetModel.definition;
      const relation = Object.keys(targetDefinition.relations).find(rel=>targetDefinition.relations[rel].model === sourceModelName);
      return targetDefinition.relations[relation].foreignKey;
    };
    const rightOperand = `"${definition.association}"."${getForeignKey()}"`;
    outputBuilder = builder
      .leftJoin({value: targetModel.table, as: definition.association})
      .on(leftOperand, rightOperand);
    if (where) {
      outputBuilder.and(where);
    }
    return outputBuilder.noop();
  }
});

const manyToOne = Object.assign({}, selectFields, {
  join(builder){
    const definition = this.definition;
    const targetModel = this.sh.model(definition.model);
    const sourceModel = this.model;
    const leftOperand = [sourceModel.definition.table, definition.foreignKey].join('.');
    const rightOperand = `"${definition.association}"."${targetModel.primaryKey}"`;
    return builder
      .leftJoin({value: targetModel.table, as: definition.association})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

const oneToOne = Object.assign({}, selectFields, {
  join(builder){
    const definition = this.definition;
    const targetModel = this.sh.model(definition.model);
    const sourceModel = this.model;
    const getForeignKey = () => {
      const modelList = this.sh.models();
      const sourceModelName = modelList.find(m=>this.sh.model(m) === sourceModel);
      const targetDefinition = targetModel.definition;
      const relation = Object.keys(targetDefinition.relations).find(rel=>targetDefinition.relations[rel].model === sourceModelName);
      return targetDefinition.relations[relation].foreignKey;
    };
    const leftOperand = [sourceModel.definition.table, sourceModel.primaryKey].join('.');
    const rightOperand = `"${definition.association}"."${getForeignKey()}"`;
    return builder
      .leftJoin({value: targetModel.table, as: definition.association})
      .on(leftOperand, rightOperand)
      .noop();
  }
});


exports.helper = function (targetModel, association) {
  if (!association.relation) {
    console.log(association);
    throw new Error('invalid association definition');
  }
  const props = {
    model: {
      value: targetModel
    },
    sh: {
      value: targetModel.shiphold
    },
    definition: {
      value: association
    }
  };
  switch (association.relation) {
    case 'belongsToMany':
      return Object.create(manyToMany, props);
    case 'hasMany':
      return Object.create(oneToMany, props);
    case 'belongsTo':
      return Object.create(manyToOne, props);
    case 'hasOne':
      return Object.create(oneToOne, props);
    default:
      throw new Error('unknown relation ' + association.relation);
  }
};