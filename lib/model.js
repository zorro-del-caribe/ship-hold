const runner = require('./runner');
const instanceFactory = require('./modelInstance');
const util = require('./util');

function reduce (primaryKey, instanceFactory, models) {
  return function (stream) {
    return function (params = {}, consumer) {
      stream(params, function* () {
        let current = {};
        const iterator = consumer();
        iterator.next();
        try {
          while (true) {
            const row = yield;
            const normalizedRow = util.normalizeRow(row);
            if (current[primaryKey] === undefined) {
              //first one
              current = util.flattenToArray({}, normalizedRow, models);
            } else if (current[primaryKey] !== normalizedRow[primaryKey]) {
              //new one
              iterator.next(instanceFactory(Object.assign({}, current)));
              // update current
              current = util.flattenToArray({}, normalizedRow, models)
            } else {
              // append
              current = util.flattenToArray(current, normalizedRow, models)
            }
          }
        } catch (e) {
          iterator.throw(e)
        } finally {
          iterator.next(current);
          iterator.return();
        }
      });
    };
  };
}

function decorateStream (runner, builder, decorator) {
  const originalStream = runner.stream.bind(builder);
  runner.stream = decorator(originalStream);
}

function inc (service) {
  return function include () {
    const selectBuilder = this;
    const query = service.query();
    const instanceFactory = service.new.bind(service);
    const nodeFactory = query.nodes;
    const {table, primaryKey, shiphold:sh, connectionString} = service;

    const models = util.normalizeInclude([...arguments], sh);
    const selectedFields = [...this.selectNodes].map(f=>f.value === '*' ? {value: table + '.*'} : Object.assign({}, f, {value: [table, f.value].join('.')}));

    //add primary key if not present
    const fullPrimary = [table, primaryKey].join('.');
    if (!selectedFields.some(f=>f.value === fullPrimary)) {
      selectedFields.unshift({value: fullPrimary});
    }

    const includeFields = models.reduce((previous, current) => {
      return previous.concat(current.attributes.map(attr=> {
        const label = [current.model, attr].join('.');
        return {
          value: label,
          as: label
        }
      }))
    }, []);

    const allFields = [...selectedFields, ...includeFields];

    this.selectNodes = nodeFactory.compositeNode().add('*');

    let newQueryBuilder = query
      .select(...allFields)
      .from({value: selectBuilder, as: table});

    for (const m of models) {
      newQueryBuilder = newQueryBuilder
        .leftJoin(m.model)
        .on(['users', 'id'].join('.'), '"products"."userId"'); //todo
    }

    const sources = runner({connectionString, instanceFactory});

    decorateStream(sources, newQueryBuilder, reduce(primaryKey, instanceFactory, models));

    return Object.assign(newQueryBuilder, sources);
  }

}

const proto = {
  select(...args){
    const query = this.query();
    const connectionString = this.connectionString;
    const instanceFactory = this.new.bind(this);
    return Object.assign(
      query
        .select(...args)
        .from(this.table),
      runner({connectionString, instanceFactory}), {
        include: inc(this)
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