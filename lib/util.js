exports.normalizeInclude = function (targetModel, shiphold, includes) {

  function loadAllProperties (associaton) {
    const targetAssociations = targetModel.definition.relations;
    const model = targetAssociations[associaton].model;
    return Object.keys(shiphold.model(model).definition.columns);//todo (use array instead of map object)
  }

  // 1 normalize
  const associations = includes.map(inc=> {
    let output = inc.association ? Object.assign({}, inc) : {};
    if (!inc.association) {
      const parts = inc.split('.');
      output.association = parts[0];
      output.attributes = parts[1] ? [parts[1]] : loadAllProperties(parts[0]);
    }

    if (!output.attributes) {
      output.attributes = loadAllProperties(inc.association);
    }

    const associationDef = targetModel.definition.relations[output.association];
    return Object.assign(output, associationDef, {pointer: shiphold.model(associationDef.model).primaryKey});
  });

  // 2 group by association and reduce
  const groups = {};

  for (const asso of associations) {
    const associationName = asso.association;
    if (!groups[associationName]) {
      groups[associationName] = asso;
    } else {
      const group = groups[associationName];
      group.attributes = group.attributes.concat(asso.attributes);
    }

    if (asso.where) {
      const group = groups[associationName];
      group.where = asso.where;
    }
  }
  return Object.keys(groups).map(k=>groups[k]);
};

function recursiveGet (ctx, ...parts) {
  const [first, ...others] = parts;
  return !others.length || ctx[first] === undefined ? ctx[first] : recursiveGet(ctx[first], ...others);
}

exports.jsonPointer = function pointer (path) {
  const parts = path.split('.');
  return {
    get(ctx){
      return recursiveGet(ctx, ...parts);
    },
    set(ctx, value){
      let currentCtx = ctx;
      let prop;
      const depth = [...parts];
      while (depth.length > 1) {
        prop = depth.shift();
        if (currentCtx[prop] === undefined) {
          currentCtx[prop] = {};
        }
        currentCtx = currentCtx[prop];
      }
      currentCtx[depth[0]] = value;
      return ctx;
    }
  };
};

exports.normalizeRow = function (row, aggDirectives = []) {
  const output = {};
  const rowKeys = Object.keys(row);
  const selfProps = rowKeys.filter(key=>key.split('.').length === 1);
  for (const prop of selfProps) {
    output[prop] = row[prop];
  }
  for (const ad of aggDirectives.filter(ad=>ad.relation !== 'self')) {
    if (!row[ad.pointer]) {
      output[ad.association] = ad.asCollection ? [] : null;
    } else {
      const props = ad.attributes.map(attr => {
        return {pointer: [ad.association, attr].join('.'), attr}
      });
      const item = {};
      for (const {attr, pointer} of props) {
        item[attr] = row[pointer];
      }
      output[ad.association] = ad.asCollection ? [item] : item;
    }
  }
  return output;
};