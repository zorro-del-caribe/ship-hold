const Users = sh.service({
    table: 'test_users'
    // name will be 'TestUsers'
    // primaryKey will be 'id'
});

Users === sh.service('TestUsers'); // true
