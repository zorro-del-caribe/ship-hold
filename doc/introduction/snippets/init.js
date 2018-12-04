const {shiphold} = require('ship-hold');
const sh = shiphold({
    hostname: '192.168.99.100',
    username: 'docker',
    password: 'docker',
    database: 'dev'
});
