const {shiphold} = require('../../dist/bundle');

export default ({test}) => {
    test('service registry', t => {
        const sh = shiphold();
        const Users = sh.service({name: 'Users', table: 'users', primaryKey: 'id'});
        const Users2 = sh.service('Users');
        t.eq(Users, Users2, 'services should be singletons');
    });

    test('create only a service registry per instance (not shared)', t => {
        const sh1 = shiphold();
        sh1.service({
            table: 'foo'
        });
        const sh2 = shiphold();
        sh2.service({table: 'bar'});
        t.eq([...sh1].length, 1);
    });
};