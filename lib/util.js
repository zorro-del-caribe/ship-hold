exports.normalizeInclude = function (targetModel, shiphold, includes) {
  // find association involved
  const associations = includes
    .map(m => m.split('.')[0]);

  const uniqueAssociations = [];
  for (const association of associations) {
    if (!uniqueAssociations.includes(association)) {
      uniqueAssociations.push(association)
    }
  }

  //collect models, attributes and association configuration
  const associationModels = uniqueAssociations.map(m=> {
    const expectedRelation = targetModel.relations[m];
    if (!expectedRelation) {
      throw new Error(`could not find association ${m} from ${targetModel.table}`);
    }
    return Object.assign({}, expectedRelation, {association: m, model: expectedRelation.model, attributes: []});
  });


  for (const inc of includes) {
    const parts = inc.split('.');
    const association = associationModels.filter(m=>m.association === parts[0])[0];
    
    if (parts.length === 2) {
      association.attributes.push(parts[1]);
    } else {
      //add all
      const model = shiphold.model(association.model);
      const def = model.definition;
      const columns = [...Object.keys(def.columns)];
      association.attributes.push(...columns);
    }
  }

  return associationModels;
};

exports.normalizeRow = function (row) {
  const output = {};
  for (const [model,attr] of Object.keys(row).map(k=>k.split('.'))) {
    if (!attr) {
      output[model] = row[model];
    } else {
      const full = [model, attr].join('.');
      const val = row[full];
      if (!output[model]) {
        output[model] = val !== null ? {} : null
      }
      if (output[model]) {
        output[model][attr] = val;
      }
    }
  }
  return output;
};

exports.flattenToArray = function (target, source, associations) {
  const output = Object.assign({}, source, target);
  for (const {association, asCollection} of associations) {
    const item = source[association];
    if (asCollection === true) {
      output[association] = Array.isArray(output[association]) ? output[association] : [];
      if (item !== null) {
        output[association].push(item);
      }
    } else {
      output[association] = item;
    }
  }

  return output;
};