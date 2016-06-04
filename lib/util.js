exports.normalizeInclude = function (includes, shiphold) {
  // find model involved
  const arrayModels = includes
    .map(m => m.split('.')[0]);

  const uniqueModels = [];
  for (const model of arrayModels) {
    if (!uniqueModels.includes(model)) {
      uniqueModels.push(model)
    }
  }

  //collect attributes
  const objectModels = uniqueModels.map(m=> {
    return {model: m, attributes: []}
  });


  for (const inc of includes) {
    const parts = inc.split('.');
    const m = objectModels.filter(m=>m.model === parts[0])[0];
    if (parts.length === 2) {
      m.attributes.push(parts[1]);
    } else {
      //add all
      const def = shiphold.model(inc).definition;
      const columns = [...Object.keys(def.columns)];
      m.attributes.push(...columns);
    }
  }

  return objectModels;
};

exports.normalizeRow = function (row) {
  const output = {};
  for (const [model,attr] of Object.keys(row).map(k=>k.split('.'))) {
    if (!attr) {
      output[model] = row[model];
    } else {
      const full = [model, attr].join('.');
      output[model] = output[model] || {};
      output[model][attr] = row[full];
    }
  }
  return output;
};

exports.flattenToArray = function (target, source, models) {
  const ms = models.map(m=>m.model);
  const output = Object.assign({}, source, target);
  for (const m of ms) {
    const item = source[m];
    output[m] = Array.isArray(output[m]) ? output[m] : [];
    output[m].push(item);
  }

  return output;
};