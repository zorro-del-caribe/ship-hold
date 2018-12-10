const Users = sh.service({
    table: 'users',
    primaryKey: 'user_id'
});

Users
    .insert({email: 'foo@bar.com', biography: 'blah blah', first_name: 'john', last_name: 'Doe'})
    .run();

// is equivalent to

sh
    .insert({email: 'foo@bar.com', biography: 'blah blah', first_name: 'john', last_name: 'Doe'})
    .into('users')
    .returning('*');
