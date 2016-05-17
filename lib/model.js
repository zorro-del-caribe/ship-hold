const shipHoldBuilder = require('ship-hold-querybuilder');
const stampit = require('stampit');

const builder = shipHoldBuilder();

module.exports = stampit()
  .init(function () {
    const table = this.table;
    if (!table) {
      throw new Error('model can only be instanciated with a table name')
    }
    Object.defineProperty(this, 'table', {
      get(){
        return table;
      }
    });
  })
  .methods({
    select(...args){
      return builder.select(...args)
        .from(this.table);
    },
    insert(...args){
      return builder
        .insert(...args)
        .into(this.table);
    },
    update(){
      return builder.update(this.table);
    },
    delete(){
      return builder.delete(this.table);
    },
    if: builder.if
  });
