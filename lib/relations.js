const selectFieldsBehaviour = {
  selectFields(){
    const def = this.definition;
    const output = def.attributes.map(mapAttributes);
    return output;
    function mapAttributes (att) {
      const value = [def.as, att].join('.');
      const as = `"${value}"`;
      return {value, as};
    }
  }
};

function getReverseAssociation (sourceModel, association, sh) {
  const targetModel = sh.model(association.model);
  const targetRelations = targetModel.definition.relations;
  const reverseRelationName = Object.keys(targetRelations).filter(r=>targetRelations[r].model === sourceModel.name)[0];
  return targetRelations[reverseRelationName];
}

const manyToMany = Object.assign({}, selectFieldsBehaviour, {
  join(builder){
    const {definition, sh}=this;
    const sourceModelDef = this.model.definition;

    const targetModel = sh.model(definition.model);
    const pivotModel = sh.model(this.definition.through);

    const sourceKeyOnPivot = sourceModelDef.relations[definition.as].referenceKey;
    const targetKeyOnPivot = getReverseAssociation(this.model, definition, sh).referenceKey;

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

    pivot = pivot
      .join({value: this.builder, as: targetModel.table})
      .on(pivotLeftOperand, pivotRightOperand)
      .noop();

    const leftOperand = [sourceModelDef.table, this.model.primaryKey].join('.');
    const rightOperand = `"${definition.as}"."${definition.through}.${sourceKeyOnPivot}"`;

    return builder
      .leftJoin({value: pivot, as: definition.as})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

const oneToMany = Object.assign({}, selectFieldsBehaviour, {
  join(builder){
    const {definition, model:sourceModel} = this;

    const foreignKey = getReverseAssociation(sourceModel, definition, this.sh).foreignKey;
    const leftOperand = [sourceModel.definition.table, sourceModel.primaryKey].join('.');
    const rightOperand = `"${definition.as}"."${foreignKey}"`;

    return builder
      .leftJoin({value: this.builder, as: definition.as})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

const manyToOne = Object.assign({}, selectFieldsBehaviour, {
  join(builder){
    const {definition, model:sourceModel} = this;
    const targetModel = this.sh.model(definition.model);
    const leftOperand = [sourceModel.definition.table, definition.foreignKey].join('.');
    const rightOperand = `"${definition.as}"."${targetModel.primaryKey}"`;
    return builder
      .leftJoin({value: this.builder, as: definition.as})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

const oneToOne = Object.assign({}, selectFieldsBehaviour, {
  join(builder){
    const definition = this.definition;
    const sourceModel = this.model;

    const foreignKey = getReverseAssociation(sourceModel, definition, this.sh).foreignKey;
    const leftOperand = [sourceModel.definition.table, sourceModel.primaryKey].join('.');
    const rightOperand = `"${definition.as}"."${foreignKey}"`;

    return builder
      .leftJoin({value: this.builder, as: definition.as})
      .on(leftOperand, rightOperand)
      .noop();
  }
});

module.exports = function relationFactory (sourceModel, builder) {
  const shiphold = sourceModel.shiphold;
  const relationDefinition = builder.relation;
  const props = {
    model: {
      value: sourceModel
    },
    sh: {
      value: shiphold
    },
    definition: {
      value: relationDefinition
    },
    builder: {value: builder}
  };
  switch (relationDefinition.relation) {
    case 'belongsToMany':
      return Object.create(manyToMany, props);
    case 'hasMany':
      return Object.create(oneToMany, props);
    case 'belongsTo':
      return Object.create(manyToOne, props);
    case 'hasOne':
      return Object.create(oneToOne, props);
    default:
      throw new Error('unknown relation ' + relationDefinition.relation);
  }
};