const previousSym = Symbol();

module.exports = function (service) {

  const proto = {
    delete(){
      const id = this[service.primaryKey];
      return service.delete()
        .where(service.primaryKey, '$id')
        .run({id});
    },
    fetch(...args){
      const id = this[service.primaryKey];
      return service
        .select(...args)
        .where(service.primaryKey, '$id')
        .run({id})
        .then((res)=> {
          if (res[0]) {
            this[previousSym] = Object.assign({}, this, res[0]);
          }
          return Object.assign(this, res[0]);
        });
    },
    save(params = {}){
      const parameters = Object.assign({}, this, params);
      const definition = service.definition;
      const columnDef = definition.columns || {};
      const columns = Object.keys(columnDef);

      //filter updated values only (and defined on the model)
      const validKeys = Object.keys(parameters)
        .filter(key=>parameters[key] !== this[previousSym][key] && columns.includes(key));

      const validParams = {};
      for (const prop of validKeys) {
        validParams[prop] = parameters[prop];
      }

      //update prop on definition only
      const builder = service.update();

      for (const p of validKeys) {
        builder.set(p, '$' + p);
      }

      return validKeys.length ? builder
        .where(service.primaryKey, '$id')
        .returning(...validKeys)
        .run(Object.assign({}, validParams, {id: this[service.primaryKey]}))
        .then(res=> {
          this[previousSym] = Object.assign({}, this, res[0]);
          return Object.assign(this, res[0]);
        }) : Promise.resolve(this);
    },
    create(params = {}){
      const parameters = Object.assign({}, this, params);
      const definition = service.definition;
      const columnDef = definition.columns || {};
      const columns = Object.keys(columnDef);

      const validKeys = Object.keys(parameters)
        .filter(key=>columns.includes(key));

      const validParams = {};
      for (const prop of validKeys) {
        validParams[prop] = parameters[prop];
      }

      //update prop on definition only
      const builder = service.insert();

      for (const p of validKeys) {
        builder.value(p, '$' + p);
      }

      return validKeys.length ? builder
        .returning(...validKeys)
        .run(Object.assign({}, validParams))
        .then(res=> {
          this[previousSym] = Object.assign({}, this, res[0]);
          return Object.assign(this, res[0]);
        }) : Promise.resolve(this);
    }
  };

  return function (attributes = {}) {
    const instance = Object.create(proto);
    Object.assign(instance, attributes);
    instance[previousSym] = Object.assign({}, instance);
    return instance;
  };
};