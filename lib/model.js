const runner = require('./runner');
const instanceFactory = require('./modelInstance');
const util = require('./util');
const relationFactory = require('./relations').relationFactory;

function includeFactory (service) {
  return function include () {
    const selectBuilder = this;
    const query = service.query();
    const nodeFactory = query.nodes;
    const {table, shiphold:sh} = service;
    const associations = util.normalizeInclude(service, [...arguments]);
    const selectedFields = [...this.selectNodes].map(f=>f.value === '*' ? {value: table + '.*'} : Object.assign({}, f, {value: [table, f.value].join('.')}));

    this.selectNodes = nodeFactory.compositeNode().add('*');

    let newQueryBuilder = query
      .select(...selectedFields)
      .from({value: selectBuilder, as: table});

    newQueryBuilder.orderByNodes = this.orderByNodes;

    for (const m of associations) {
      const relation = relationFactory(service, m);
      newQueryBuilder
        .select(...relation.selectFields());
      relation.join(newQueryBuilder, m.where);
    }

    associations.unshift({relation: 'self', pointer: service.primaryKey});
    return Object.assign(newQueryBuilder, runner({service, aggregationDirectives: associations}));
  }
}

const proto = {
  select(){
    const query = this.query();
    return Object.assign(
      query
        .select(...arguments)
        .from(this.table),
      runner({service: this, aggregationDirectives: [{relation: 'self', pointer: this.primaryKey}]}), {
        include: includeFactory(this)
      }
    );
  },
  insert(){
    const query = this.query();
    return Object.assign(query
      .insert(...arguments)
      .into(this.table)
      .returning('*')
      , runner({service: this}));
  },
  update(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .update(this.table)
      .returning('*'), runner({service: this}));
  },
  delete(){
    const instanceFactory = this.new.bind(this);
    const connectionString = this.connectionString;
    return Object.assign(this.query()
      .delete(this.table), runner({service: this}));
  },
  if(){
    return this.query().condition().if(...arguments);
  },
  association(name){
    return this.definition.relations[name];
  }
};

module.exports = function ({definition, connectionString, shiphold, name}) {
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
    },
    name: {
      value: name
    },
    columns: {
      get(){
        return Object.keys(this.definition.columns)
      }
    }
  });
  service.new = instanceFactory(service);
  return service;
};