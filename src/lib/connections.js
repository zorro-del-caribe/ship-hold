const pg = require('pg');

module.exports = function ({connectionString}) {
  return {
    getConnection(){
      return new Promise(function (resolve, reject) {
        pg.connect(connectionString, function (err, client, done) {
          if (err) {
            return reject(err);
          }
          return resolve({client, done});
        });
      });
    },
    stop(){
      pg.end();
    }
  };
};