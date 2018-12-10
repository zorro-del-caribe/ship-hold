const Users = sh.service({
    table: 'users',
    primaryKey: 'user_id'
});

Users
    .update({biography: 'blah blah blah'})
    .where('user_id', 42)
    .run();

// is equivalent to

sh
    .update('users')
    .set('biography', 'blah blah blah')
    .where('user_id', 42)
    .returning('*')
    .run();
