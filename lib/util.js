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
  const {shiphold} = sourceModel;
  const reduce = function (sourceModel) {
    return function (previous, current) {
      let asso, attr, attributes = [];

      if (typeof current === 'object') {
        asso = current.association;
        attr = current.attributes || [];
      } else {
        const parts = current.split('.');
        asso = parts.shift();
        if (parts.length > 1) {
          const subAsso = parts.shift();
          const nested = [{association: subAsso, attributes: [parts.join('.')]}];
          current = {association: asso, nested}
        } else {
          attr = parts.length ? [parts.join('.')] : [];
        }
      }

      if (current.nested) {
        const subModel = shiphold.model(sourceModel.association(current.association).model);
        current.nested = normalizeInclude(subModel, current.nested);
      }

      const filtered = previous.filter(a=>a.association === asso);
      if (attr !== undefined) {
        attributes = attr.length === 0 || attr[0] === '*' ? loadAllProperties(sourceModel, asso) : attr;
      }
      const existingAsso = filtered.length > 0 ? filtered[0] : {association: asso, attributes: attributes};
      if (filtered.length > 0) {
        existingAsso.attributes.push(...attributes);
      } else {
        previous.push(existingAsso);
      }
      if (current.where) {
        existingAsso.where = current.where;
      }
      if (current.nested) {
        existingAsso.nested = existingAsso.nested || [];
        for (const n of current.nested) {
          const existingNested = existingAsso.nested.filter(a=>a.association === n.association);
          if (existingNested.length) {
            existingNested[0].attributes.push(...n.attributes);
          } else {
            existingAsso.nested.push(n);
          }
        }
      }
      return previous;
    }
  };
  const reduceAssociation = includes.reduce(reduce(sourceModel), []);

  return reduceAssociation.map(a=> {
    const associationDef = sourceModel.association(a.association);
    const pointerParts = [a.association, shiphold.model(associationDef.model).primaryKey];
    return Object.assign(a, associationDef, {pointer: pointerParts.join('.')});
  });
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
      const nestedNormalized = normalizeRow(subRow(row, ad), ad.nested);
      output[ad.association] = ad.asCollection ? [nestedNormalized] : nestedNormalized;
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