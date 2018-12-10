const Users = sh.service({
    table: 'users',
    primaryKey: 'user_id'
});

Users
    .delete()
    .where('user_id', 42)
    .run();

// is equivalent to

sh
    .delete('users')
    .where('user_id', 42)
    .run();
