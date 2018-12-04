# Ship-hold

[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)
[![Gitter](https://badges.gitter.im/zorro-del-caribe/ship-hold.svg)](https://gitter.im/zorro-del-caribe/ship-hold?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Introduction

**ship-hold** is a *small* and *[fast]()* data access framework for [Postgres](https://www.postgresql.org/) relational database system, developed for the [nodejs](https://nodejs.org/) environment.

It is based around intuitive [sql query builders](#query-builders) which mirror closely the SQL syntax while keeping the flexibility functions may have. It also allows you to create convenient services and relations between them in order to easily query related resources (aka "eager loading").
It is actually the only library I know of which has it right when it comes to nested pagination !

It defers quite a lot from other popular libraries so called **ORM** such [sequelize](http://docs.sequelizejs.com/) or [Bookshelf](http://bookshelfjs.org/):
they usually come with a lot of features (schema management, migrations, validations, different sql dialects, model instances, etc) and more complex API's / code base (we are usually talking about more than 200 api functions and more than 10/20 thousands of source lines of code).
However, ship-hold focuses on a limited set of features while remaining extensible (builders are just functions !)

## table of content

1. [getting started](#getting-started)
2. [query builders](#query-builders)
3. [query runner](#query-runner-and-api-adapters)
4. [models](#models)
5. [extensions](#extend-ship-hold)
6. [performances](#performances)
7. [sample application](#sample-application)
8. [contributing](#contributing)

##Getting started

### Install
run in your terminal ``npm install ship-hold`` (assuming you have [npm](https://npmjs.org) installed)

### initialisation

Pass database connection information to the ship-hold factory

```Javascript

const {shiphold} = require('ship-hold');
const sh = shiphold({
    hostname:'192.168.99.100'
    username:'docker',
    password:'docker',
    database:'dev'
});

```

Every option the driver [pg]() takes, can be passed.

That's it ! You can start to use your database.

```Javascript
const users = await sh.select()
    .from('users')
    .where('age','>', '$age')
    .and('name', 'ILIKE', '$name')
    .run({
        age:42,
        name:'lorenzo'
    })
```
