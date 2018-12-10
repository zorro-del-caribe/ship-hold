const Users = sh.service({
    table: 'users'
});

const Phones = sh.service({
    table: 'phones'
});

//Users have one phone
Users.hasOne(Phones, 'phone');

//A phone belongs to a given user
//The foreign key in the phones table which references users table is "user_id"
Phones.belongsTo(Users, 'user_id', 'owner');

