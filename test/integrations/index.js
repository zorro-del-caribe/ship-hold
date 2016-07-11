const shiphold = require('ship-hold');
const sh = shiphold({
  hostname: process.env.DB_HOSTNAME || '192.168.99.100',
  username: process.env.DB_USERNAME || 'docker',
  password: process.env.DB_PASSWORD || 'docker',
  database: process.env.DB_NAME || 'ship-hold-test'
});
const test = require('./testExtension');

test(sh);

require('./setup')(sh)
  .then(function () {
    require('./select_simple')(sh);
    require('./select_associations')(sh);
    require('./insert')(sh);
    require('./update')(sh);
  })
  .catch(function (err) {
    console.log(err);
  });
