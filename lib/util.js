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
  return includes.map(inc=> {
    let builder;
    const sh = sourceModel.shiphold;
    const modelRelations = sourceModel.definition.relations;

    const isString = typeof inc === 'string';
    if (isString) {
      builder = sh.model(sourceModel.association(inc).model).select();
    } else {
      //revoke any on going proxy
      if (Object.keys(inc).indexOf('noop') !== -1) {
        builder = inc.noop();
      } else {
        builder = inc.select();
      }
    }

    const assoName = Object.keys(modelRelations).find(asso=>modelRelations[asso].model === builder.name) || builder.name;
    const assoDef = modelRelations[assoName] || {/*todo*/};
    const targetModel = sh.model(assoDef.model);
    const attributes = normalizeAttributes(builder, sh);

    if (!builder.associations) {
      builder.selectNodes = sh.nodes.compositeNode().add('*');
    }

    const pointerParts = [assoName, targetModel.primaryKey];
    builder.relation = Object.assign(assoDef, {
      as: assoName,
      attributes,
      pointer: pointerParts.join('.'),
      nested: builder.associations || []
    });
    return builder;
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
      output[ad.as] = ad.asCollection ? [] : null;
    } else if (ad.nested && ad.nested.length) {
      const subR = subRow(row, ad);
      const nestedNormalized = normalizeRow(subR, ad.nested);
      output[ad.as] = ad.asCollection ? [nestedNormalized] : nestedNormalized;
    } else {
      const props = ad.attributes.map(f => {
        return {pointer: [ad.as, f].join('.'), attr: f}
      });
      const item = {};
      for (const {attr, pointer} of props) {
        item[attr] = row[pointer];
      }
      output[ad.as] = ad.asCollection ? [item] : item;
    }
  }
  return output;
};

function subRow (row, assoDef) {
  return Object.keys(row)
    .filter(k=>k.split('.')[0] === assoDef.as)
    .map(k=> {
      [main, ...subs] = k.split('.');
      return subs.join('.');
    })
    .reduce((previous, current)=> {
      previous[current] = row[[assoDef.as, current].join('.')];
      return previous;
    }, {});
}

function recursiveGet (ctx, ...parts) {
  const [first, ...others] = parts;
  return !others.length || ctx[first] === undefined ? ctx[first] : recursiveGet(ctx[first], ...others);
}

function normalizeAttributes (builder, sh) {

  const selectNodesValues = [...builder.selectNodes].map(n=>n.value);
  const normalizedSelectNodes = selectNodesValues[0] === '*' ? sh.model(builder.name).columns : selectNodesValues;
  const normalizedAttributes = [];
  if (builder.associations) {
    // if nested include
    const selfAsso = builder.associations.find(a=>a.relation === 'self');
    const selfModel = sh.model(selfAsso.model);
    for (const sv of normalizedSelectNodes) {
      const [base,...rest] = sv.split('.');
      if (base === selfModel.table) {
        if (rest[0] === '*') {
          normalizedAttributes.push(...selfModel.columns);
        } else {
          normalizedAttributes.push(rest.join('.'));
        }
      } else {
        normalizedAttributes.push(sv);
      }
    }
  } else {
    normalizedAttributes.push(...normalizedSelectNodes);
  }

  return normalizedAttributes;
}