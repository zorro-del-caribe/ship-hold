const shiphold = require('ship-hold');
const sh = shiphold({
  hostname: '192.168.99.100',
  username: 'docker',
  password: 'docker',
  database: 'ship-hold-test'
});
const test = require('./testExtension');

test(sh);

require('./select_simple')(sh);
require('./select_associations')(sh);
require('./insert')(sh);
require('./update')(sh);