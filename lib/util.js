function loadAllProperties (sourceModel, asso, shiphold) {
  const associations = sourceModel.definition.relations;
  const model = associations[asso].model;
  return Object.keys(shiphold.model(model).definition.columns);
}

function subRow (row, assoDef) {
  return Object.keys(row)
    .filter(k=>k.split('.')[0] === assoDef.association)
    .map(k=> {
      [main, ...subs] = k.split('.');
      return subs.join('.');
    })
    .reduce((previous, current)=> {
      previous[current] = row[[assoDef.association, current].join('.')];
      return previous;
    }, {})
}

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

exports.normalizeInclude = function normalizeInclude (sourceModel, shiphold, includes) {
  // 1 normalize
  const associations = includes.map(inc=> {
    let output = inc.association ? inc : {};
    if (!inc.association) {
      const parts = inc.split('.');
      output.association = parts[0];
      output.attributes = parts[1] ? [parts[1]] : loadAllProperties(sourceModel, parts[0], shiphold);
    }

    if (!output.attributes) {
      output.attributes = loadAllProperties(sourceModel, inc.association, shiphold);
    }

    const associationDef = sourceModel.definition.relations[output.association];

    if (inc.nested) {
      output.nested = normalizeInclude(shiphold.model(associationDef.model), shiphold, inc.nested, output.association);
    }
    const pointerParts = [output.association, shiphold.model(associationDef.model).primaryKey];
    return Object.assign(output, associationDef, {pointer: pointerParts.join('.')});
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
      group.nested = (group.nested || []).concat(group.nested || []);
    }

    if (asso.where) {
      const group = groups[associationName];
      group.where = asso.where;
    }
  }
  return Object.keys(groups).map(k=>groups[k]);
};

exports.normalizeRow = function normalizeRow (row, aggDirectives = []) {
  const output = {};
  const rowKeys = Object.keys(row);
  const selfProps = rowKeys.filter(key=>key.split('.').length === 1);

  for (const prop of selfProps) {
    output[prop] = row[prop];
  }

  for (const ad of aggDirectives.filter(ad=>ad.relation !== 'self')) {
    if (!row[ad.pointer]) {
      output[ad.association] = ad.asCollection ? [] : null;
    } else if (ad.nested && ad.nested.length) {
      output[ad.association] = normalizeRow(subRow(row, ad), ad.nested);
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