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

exports.normalizeInclude = function normalizeInclude (sourceModel, includes) {
  // 1 normalize
  const associations = includes.map(normalizeFactory(sourceModel));
  // 2 group by association and reduce
  const groups = {};

  for (const asso of associations) {
    const associationName = asso.association;
    groups[associationName] = mergeAssociation(groups[associationName], asso);

    if (asso.where) {
      const group = groups[associationName];
      group.where = asso.where;
    }
  }
  return Object.keys(groups).map(k=>groups[k]);

  function normalizeFactory (sourceModel) {
    const shiphold = sourceModel.shiphold;
    return function normalize (inc) {
      let output = inc.association ? inc : {};
      if (!inc.association) {
        const [association,...attributes] = inc.split('.');
        output = {association};
        if (attributes.length > 1) {
          const [subAsso, ...subAttributes] = attributes;//[products,[id]]
          const assoModel = shiphold.model(sourceModel.association(association).model); //Products
          output = normalize({
            association,
            nested: [normalizeFactory(assoModel)({association: subAsso, attributes: subAttributes})],//Products, 'id'
            attributes: []
          });
        } else {
          output.attributes = !attributes.length || attributes[0] === '*' ? loadAllProperties(sourceModel, association) : attributes;
        }
      }

      if (!output.attributes || output.attributes[0] === '*') {
        output.attributes = loadAllProperties(sourceModel, inc.association);
      }

      const associationDef = sourceModel.association(output.association);

      if (inc.nested) {
        output.nested = normalizeInclude(shiphold.model(associationDef.model), inc.nested);
      }
      const pointerParts = [output.association, shiphold.model(associationDef.model).primaryKey];
      return Object.assign(output, associationDef, {pointer: pointerParts.join('.')});
    }
  }
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

function loadAllProperties (sourceModel, asso) {
  const shiphold = sourceModel.shiphold;
  const associations = sourceModel.definition.relations;
  const modelName = associations[asso].model;
  return shiphold.model(modelName).columns;
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
    }, {});
}

function recursiveGet (ctx, ...parts) {
  const [first, ...others] = parts;
  return !others.length || ctx[first] === undefined ? ctx[first] : recursiveGet(ctx[first], ...others);
}

function mergeAssociation (target, toMerge) {
  if (!target) {
    return toMerge;
  } else {
    const attrs = toMerge.attributes.filter(a=>target.attributes.indexOf(a) === -1);
    target.attributes = target.attributes.concat(attrs);
    target.nested = (toMerge.nested || []).map(n=> {
      const existing = (target.nested || []).filter(tn=>tn.association === n.association);
      return existing.length ? mergeAssociation(existing[0], n) : n;
    });
    return target;
  }
}