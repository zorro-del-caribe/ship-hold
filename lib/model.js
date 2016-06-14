const runner = require('./runner');
const instanceFactory = require('./modelInstance');
const util = require('./util');
const relationFactory = require('./relations').helper;

function includeFactory (service) {
  return function include () {
    const selectBuilder = this;
    const query = service.query();
    const nodeFactory = query.nodes;
    const {table, primaryKey, shiphold:sh} = service;
    const associations = util.normalizeInclude(service, sh, [...arguments]);
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
    const aggregationDirectives = associations
      .map(a=>Object.assign({}, a, {pointer: [a.association, sh.model(a.model).primaryKey].join('.')}));
    aggregationDirectives.unshift({relation: 'self', pointer: service.primaryKey});

    const sources = runner({service, aggregationDirectives});
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
      runner({service: this, aggregationDirectives: [{relation: 'self', pointer: this.primaryKey}]}), {
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
    return this.query().condition().if(...arguments);
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
    }
  });
  service.new = instanceFactory(service);
  return service;
};