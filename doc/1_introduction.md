# Ship-hold

[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)

## Introduction

**ship-hold** is a data access framework for [Postgres](https://www.postgresql.org/) relational database system, developed for the [nodejs](https://nodejs.org/) platform (version > 6, if not transpiled).
It is based around intuitive [sql query builders]() and allows you as well to manage model definitions and relations (with eager loading, etc). It defers quite a lot from other popular libraries so called **ORM** such [sequelize](http://docs.sequelizejs.com/) or [Bookshelf](http://bookshelfjs.org/):  
they usually come with a lot of features (schema management, migrations, validations, etc) and more complex API's / code base (few thousands of sloc). 
However, ship-hold focuses on a limited set of features and a very powerful [extension mechanism](). As a result, [ship-hold-querybuilder](https://github.com/zorro-del-caribe/ship-hold-querybuilder) code base is less than 450 sloc and less than 600 for ship-hold itself. The idea is to build [extension modules]() with their own purposes/opinions, a little bit like popular web frameworks such [koajs](http://koajs.com/).  
d
##Getting started

### Install
run in your terminal ``npm install ship-hold`` (assuming you have [npm](npmjs.org) installed)

### initialisation

Pass database connection information to the ship-hold factory

```Javascript

const shiphold = require('ship-hold');
const sh = shiphold({
    hostname:'192.168.99.100'
    username:'docker',
    password:'docker',
    database:'dev'
});

```

Define your models and the relations between them.

```Javascript

const Users=sh.model('Users',{
    table:'users',
    columns:{
        id:'integer',
        age:'integer',
        name:'varchar'
    }
});

```

And start using the query builders.

```Javascript

Users
  .select('name','age')
  .where('name','Laurent')
  .run()
  .then(rows => {console.log(rows)}); // [{name:'Laurent',age:29}]

```