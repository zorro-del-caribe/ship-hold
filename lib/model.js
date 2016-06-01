const runner = require('./runner');
const instanceFactory = require('./modelInstance');


function normalizeInclude (includes, sh) {
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
      const def = sh.model(inc).definition;
      const columns = [...Object.keys(def.columns)];
      m.attributes.push(...columns);
    }
  }

  return objectModels;
}

function normalizeRow (row) {
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
}

const proto = {
  select(...args){
    const query = this.query();
    const connectionString = this.connectionString;
    const instanceFactory = this.new.bind(this);
    const nodeFactory = query.nodes;
    const tableName = this.table;
    const primaryKey = this.primaryKey;
    const sh = this.shiphold;

    function inc () {
      return function include () {
        const models = normalizeInclude([...arguments], sh);
        const fromClause = this;
        const selectedField = [...this.selectNodes].map(f=>f.value === '*' ? {value: tableName + '.*'} : f);
        const includeFields = models.reduce((previous, current) => {
          return previous.concat(current.attributes.map(attr=> {
            const label = [current.model, attr].join('.');
            return {
              value: label,
              as: label
            }
          }))
        }, []);

        const allFields = [...selectedField, ...includeFields];
        fromClause.selectNodes = nodeFactory.compositeNode().add('*');
        let newQueryBuilder = query
          .select(...allFields)
          .from({value: fromClause, as: tableName});

        for (const m of models) {
          newQueryBuilder = newQueryBuilder
            .leftJoin(m.model)
            .on(['users', 'id'].join('.'), '"products"."userId"'); //todo
        }

        const sources = runner({connectionString, instanceFactory});
        const originalStream = sources.stream.bind(newQueryBuilder);
        sources.stream = function (params = {}, consumer) {
          const iterator = consumer();
          iterator.next();
          originalStream(params, function* () {
            let current = {};
            try {
              while (true) {
                const row = yield;
                const normalizedRow = normalizeRow(row);
                if (row[primaryKey] !== current[primaryKey]) {
                  if (current[primaryKey]) {
                    iterator.next(current);
                  } else {
                    current = instanceFactory(normalizedRow);
                    current.products = [current.products];
                  }
                  //create new current
                } else {
                  current.products.push(normalizedRow.products);
                }
              }
            } catch (e) {
              iterator.throw(e)
            } finally {
              iterator.return();
            }
          });
        };
        return Object.assign(newQueryBuilder, sources);
      }

    }

    return Object.assign(
      query
        .select(...args)
        .from(this.table),
      runner({connectionString, instanceFactory}), {
        include: inc()
      }
    );
  },
  insert(...args){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .insert(...args)
      .into(this.table), runner({connectionString, instanceFactory}));
  },
  update(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .update(this.table), runner({connectionString, instanceFactory}));
  },
  delete(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .delete(this.table), runner({connectionString, instanceFactory}));
  },
  if(...args){
    return this.query()
      .if(...args);
  }
};

module.exports = function ({definition, connectionString, shiphold}) {
  const def = Object.assign({}, definition);

  //TODO (deepFreeze)
  Object.freeze(def);

  const service = Object.create(proto, {
    definition: {
      value: def,
      enumerable: true
    },
    table: {
      value: def.table
    },
    query: {
      value: shiphold.query
    },
    connectionString: {
      value: connectionString
    },
    primaryKey: {
      get(){
        return 'id';
      }
    },
    shiphold: {
      value: shiphold
    }
  });
  service.new = instanceFactory(service);
  return service;
};