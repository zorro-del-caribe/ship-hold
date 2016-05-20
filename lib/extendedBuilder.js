const pg = require('pg');
module.exports = function (connectionString) {
  return {
    run: function (params = {}) {
      return new Promise((resolve, reject)=> {
        pg.connect(connectionString, (err, client, done)=> {
          if (err) {
            done();
            return reject(new Error('could not get a connection at ' + connectionString));
          }
          const q = this.build(params);
          const qargs = [q.text];
          if (q.values.length) {
            qargs.push(q.values);
          }
          qargs.push((err, result)=> {
            done();
            if (err) {
              return reject(err);
            }
            resolve(result.rows);
          });
          client.query(...qargs);
        });
      });
    }
  };
};
