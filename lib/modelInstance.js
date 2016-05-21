const stampit = require('stampit');

const previousSym = Symbol();

module.exports = function (service) {
  return stampit()
    .init(function () {
      this[previousSym] = Object.assign({}, this);
    })
    .methods({
      delete(){
        const id = this.id;
        return service.delete()
          .where('id', '$id')
          .run({id});
      },
      fetch(...args){
        const id = this.id;
        return service
          .select(...args)
          .where('id', '$id')
          .run({id})
          .then((res)=> {
            if (res[0]) {
              this[previousSym] = Object.assign({}, this, res[0]);
            }
            return Object.assign(this, res[0]);
          });
      },
      update(params = {}){
        const parameters = Object.assign({}, this, params);
        const definition = service.definition;
        const columnDef = definition.columns || {};
        const columns = Object.keys(columnDef);

        //filter updated values only (and defined on th model
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
          .where('id', '$id')
          .returning(...validKeys)
          .run(Object.assign({}, validParams, {id: this.id}))
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

      },
      //todo
      save(){
        return service
          .select()
          .where('id', '$id')
          .run({id: this.id})
          .then(res=> {
            return res === null ? this.create() : service.update(this);
          });
      }
    });
};