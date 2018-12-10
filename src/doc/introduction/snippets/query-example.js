sh.select()
    .from('users')
    .where('age', '>', 42)
    .and('first_name', 'ILIKE', 'lorenzo')
    .run()
    .then(users => {
        console.table(users);
    });
