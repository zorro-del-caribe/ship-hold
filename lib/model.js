const runner = require('./runner');
const instanceFactory = require('./modelInstance');
const util = require('./util');

function reduce (primaryKey, instanceFactory, associations) {
  return function reduceDecorator (stream) {
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
              current = util.flattenToArray({}, normalizedRow, associations);
            } else if (current[primaryKey] !== normalizedRow[primaryKey]) {
              //new one
              iterator.next(instanceFactory(Object.assign({}, current)));
              // update current
              current = util.flattenToArray({}, normalizedRow, associations)
            } else {
              // append
              current = util.flattenToArray(current, normalizedRow, associations)
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

function includeFactory (service) {
  return function include () {
    const selectBuilder = this;
    const query = service.query();
    const instanceFactory = service.new.bind(service);
    const nodeFactory = query.nodes;
    const {table, primaryKey, shiphold:sh, connectionString} = service;

    const associations = util.normalizeInclude(service.definition, sh, [...arguments]);
    const selectedFields = [...this.selectNodes].map(f=>f.value === '*' ? {value: table + '.*'} : Object.assign({}, f, {value: [table, f.value].join('.')}));

    //add primary key if not present
    const fullPrimary = [table, primaryKey].join('.');
    if (!selectedFields.some(f=>f.value === fullPrimary || '*')) {
      selectedFields.unshift({value: fullPrimary});
    }

    const includeFields = associations.reduce((previous, current) => {
      return previous.concat(current.attributes.map(attr=> {
        const value = [current.association, attr].join('.');
        const as = [current.association, attr].join('.');
        return {
          value,
          as
        }
      }))
    }, []);

    const allFields = [...selectedFields, ...includeFields];

    this.selectNodes = nodeFactory.compositeNode().add('*');

    let newQueryBuilder = query
      .select(...allFields)
      .from({value: selectBuilder, as: table});

    for (const m of associations) {
      const sourceKey = service.keyWith(m.association);
      const targetKey = sh.model(m.model).keyWith(service.table);
      newQueryBuilder = newQueryBuilder
        .leftJoin({value: m.model, as: m.association})
        .on([table, sourceKey].join('.'), `"${m.association}"."${targetKey}"`); //todo
    }

    const sources = runner({connectionString, instanceFactory});

    decorateStream(sources, newQueryBuilder, reduce(primaryKey, instanceFactory, associations));

    return Object.assign(newQueryBuilder, sources);
  }

}

const proto = {
  select(){
    const query = this.query();
    const connectionString = this.connectionString;
    const instanceFactory = this.new.bind(this);
    return Object.assign(
      query
        .select(...arguments)
        .from(this.table),
      runner({connectionString, instanceFactory}), {
        include: includeFactory(this)
      }
    );
  },
  insert(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .insert(...arguments)
      .into(this.table)
      .returning('*')
      , runner({connectionString, instanceFactory}));
  },
  update(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .update(this.table)
      .returning('*'), runner({connectionString, instanceFactory}));
  },
  delete(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .delete(this.table), runner({connectionString, instanceFactory}));
  },
  if(){
    return this.query().condition(...arguments);
  },
  keyWith(association){
    let relDef = this.definition.relations[association];
    // or lookup by model name
    if (!relDef) {
      return this.keyWith(Object.keys(this.definition.relations).filter(rel=> rel.model === association)[0]);
    }

    switch (relDef.relation) {
      case 'belongsTo':
        return relDef.foreignKey;
      case 'belongsToMany':
        throw new Error('not implemented yet');
      default:
        return this.primaryKey;
    }
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