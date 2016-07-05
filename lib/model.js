const runner = require('./runner');
const util = require('./util');
const relationFactory = require('./relations');

const modelPrototype = {
  select: namify(function () {
    const shiphold = this.shiphold;
    const builder = shiphold
      .select(...arguments)
      .from(this.table);

    return Object.assign(builder, shiphold.runner({
      builder,
      shiphold
    }), {include: includeFactory(this)});
  }),
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

  return Object.create(modelPrototype, {
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
    }
  });
};

function namify (func) {
  return function () {
    const builder = func.call(this, ...arguments);
    builder.name = this.name;
    return builder;
  };
}

function includeFactory (service) {
  return namify(function include () {
      const selectBuilder = this;
      const nodeFactory = service.shiphold.nodes;
      const {table, shiphold:sh} = service;

      const associatedBuilders = util.normalizeInclude(service, [...arguments]);
      const selectedFields = [...this.selectNodes].map(f=> {
        return f.value === '*' ? {value: table + '.*'} : {value: [table, f.value].join('.'), as: f.value};
      });

      selectBuilder.selectNodes = sh.nodes.compositeNode().add('*');

      let newQueryBuilder = sh
        .select(...selectedFields)
        .from({value: selectBuilder, as: table});

      // todo maybe add orderBy id as default ?
      newQueryBuilder.orderByNodes = nodeFactory.compositeNode({separator: ', '});
      newQueryBuilder.orderByNodes.add(...this.orderByNodes.nodes);

      for (const builder of associatedBuilders) {
        const relation = relationFactory(service, builder);
        newQueryBuilder
          .select(...relation.selectFields());
        relation.join(newQueryBuilder);
      }

      newQueryBuilder.associations = associatedBuilders.map(ab=>ab.relation);
      newQueryBuilder.associations.unshift({relation: 'self', pointer: service.primaryKey, model: service.name});

      return Object.assign(newQueryBuilder, sh.runner({
        service,
        shiphold: sh,
        builder: newQueryBuilder
      }), {include: includeFactory(service)});
    }
  );
}