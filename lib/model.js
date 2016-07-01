const runner = require('./runner');
const instanceFactory = require('./modelInstance');
const util = require('./util');
const relationFactory = require('./relations').relationFactory;

const modelPrototype = {
  select(){
    const shiphold = this.shiphold;
    const builder = shiphold
      .select(...arguments)
      .from(this.table);

    return Object.assign(builder, shiphold.runner({
      builder,
      shiphold
    }), {include: includeFactory(this)});
  },
  insert(){
    return this.shiphold
      .insert(...arguments)
      .into(this.table)
      .returning('*');
  },
  update(){
    return this.shiphold
      .update(this.table)
      .returning('*');
  },
  delete(){
    return this.shiphold
      .delete(this.table);
  },
  if(){
    return this.shiphold.if(...arguments);
  },
  association(name){
    return this.definition.relations[name];
  }
};

module.exports = function ({definition, shiphold, name}) {
  const def = Object.assign({}, definition);

  //TODO (deepFreeze)
  Object.freeze(def);

  const service = Object.create(modelPrototype, {
    definition: {
      value: def,
      enumerable: true
    },
    table: {
      value: def.table
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
    },
    agg: {value: shiphold.aggregate}
  });
  service.new = instanceFactory(service);
  return service;
};

function includeFactory (service) {
  return function include () {
    const selectBuilder = this;
    const nodeFactory = service.shiphold.nodes;
    const {table, shiphold:sh} = service;

    const associations = util.normalizeInclude(service, [...arguments]);
    const selectedFields = [...this.selectNodes].map(f=>f.value === '*' ? {value: table + '.*'} : Object.assign({}, f, {value: [table, f.value].join('.')}));

    this.selectNodes = nodeFactory.compositeNode().add('*');

    let newQueryBuilder = sh
      .select(...selectedFields)
      .from({value: selectBuilder, as: table});

    newQueryBuilder.orderByNodes = nodeFactory.compositeNode({separator: ', '});
    newQueryBuilder.orderByNodes.add(...this.orderByNodes.nodes);

    for (const association of associations) {
      const relation = relationFactory(service, association);
      newQueryBuilder
        .select(...relation.selectFields());
      relation.join(newQueryBuilder, association.where);
    }

    associations.unshift({relation: 'self', pointer: service.primaryKey});

    return Object.assign(newQueryBuilder, sh.runner({
      service,
      aggregationDirectives: associations,
      shiphold: sh,
      builder: newQueryBuilder
    }), {include: includeFactory(service)});
  }
}