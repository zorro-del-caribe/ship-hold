const {shiphold} = require('ship-hold');
const sh = shiphold({
    hostname: '127.0.0.1',
    user: 'docker',
    password: 'docker',
    database: 'dev'
});
