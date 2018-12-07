sh
    .insert('id', 'first_name', 'last_name')
    .into('users')
    .values({id:42, first_name:'Laurent', last_name:'Renard'})
    .build();

// > { text: 'INSERT INTO "users" ( "id", "first_name", "last_name" ) VALUES
//            ( 42, 'Laurent', 'Renard' )',
//   values: [] }
