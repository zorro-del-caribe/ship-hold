sh.insert('id', 'first_name', 'last_name')
    .values([
        {first_name: 'Laurent', last_name: 'Renard'},
        {first_name: 'Charlie', last_name: 'Renard'}
    ])
    .into('users')
    .returning('id','first_name')
    .build();

//> { text:
//    `INSERT INTO "users" ( "id", "first_name", "last_name" ) VALUES
//          ( DEFAULT, 'Laurent', 'Renard' ),
//          ( DEFAULT, 'Charlie', 'Renard' )
//     RETURNING "id", "first_name"`,
//    values: [] }
