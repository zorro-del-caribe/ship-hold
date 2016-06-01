const pg = require('pg');
const adapters = require('./adapterExtensions');

module.exports = function (options = {}) {
  return Object.assign({}, {
    stream: function (params = {}, consumer) {
      const iterator = consumer();
      iterator.next(); //co routine
      pg.connect(options.connectionString, (err, client, done)=> {
        if (err) {
          done();
          return iterator.throw(err);
        }
        const q = this.build(params); //build must be assigned externally
        const qargs = [q.text];
        if (q.values.length) {
          qargs.push(q.values);
        }
        const stream = client.query(...qargs);
        stream.on('row', (r)=> {
          iterator.next(options.instanceFactory ? options.instanceFactory(r) : r);
        });

        stream.on('end', ()=> {
          done();
          iterator.return();
        });

        stream.on('error', (err)=> {
          done();
          iterator.throw(err);
        });
      });
    }
  }, adapters);
};