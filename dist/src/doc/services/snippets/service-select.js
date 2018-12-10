const Users = sh.service({
    table: 'users',
    primaryKey: 'user_id'
});

Users
    .select()
    .run();

// is equivalent to

sh
    .select()
    .from('users')
    .run();
