const stampit = require('stampit');

module.exports = function (service) {
  return stampit()
    .methods({
      delete(){
        const id = this.id;
        return service.delete()
          .where('id', '$id')
          .run({id});
      },
      update(){
      },
      fetch(...args){
        const id = this.id;
        return service
          .select(...args)
          .where('id', '$id')
          .run({id})
          .then(res=>Object.assign(this, res[0]));
      }
    });
};