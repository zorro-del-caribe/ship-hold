# Ship-hold

[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)
[![Gitter](https://badges.gitter.im/zorro-del-caribe/ship-hold.svg)](https://gitter.im/zorro-del-caribe/ship-hold?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Introduction

**ship-hold** is a data access framework for [Postgres](https://www.postgresql.org/) relational database system, developed for the [nodejs](https://nodejs.org/) platform (version > 6, if not transpiled).
It is based around intuitive [sql query builders](#query-builders) and allows you as well to manage model definitions and relations (with eager loading, etc). It defers quite a lot from other popular libraries so called **ORM** such [sequelize](http://docs.sequelizejs.com/) or [Bookshelf](http://bookshelfjs.org/):  
they usually come with a lot of features (schema management, migrations, validations, etc) and more complex API's / code base (few thousands of sloc). 
However, ship-hold focuses on a limited set of features and a very powerful [extension mechanism](#extend-ship-hold). As a result, [ship-hold-querybuilder](https://github.com/zorro-del-caribe/ship-hold-querybuilder) code base is less than 450 sloc and less than 600 for ship-hold itself. The idea is to build [extension modules](#list-of-extension-modules) with their own purposes/opinions, a little bit like popular web frameworks such [koajs](http://koajs.com/).
  
## table of content

1. [getting started](#getting-started)
2. [query builders](#query-builders)
3. [query runner](#query-runner-and-api-adapters)
4. [models](#models)
5. [extensions](#extend-ship-hold)
6. [performances](#performances)
7. [sample application](#sample-application)
8. [contributing](#contribution)

##Getting started

### Install
run in your terminal ``npm install ship-hold`` (assuming you have [npm](https://npmjs.org) installed)

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
