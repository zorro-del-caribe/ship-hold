sh.select()
    .from('users')
    .where('first_name', '$name')
    .build({
        name: 'Laurent'
    });

// > { text: 'SELECT * FROM "users" WHERE "first_name" = $1', values: [ 'Laurent' ] }
