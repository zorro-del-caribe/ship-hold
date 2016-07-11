[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)

## Introduction

Shiphold is an [ORM]() for [Postgres]() relational database system, developed for the [nodejs]() platform (version > 6).

##Getting started

### Install
run in your terminal ``npm install shiphold`` (assuming you have [npm]() installed)

### initialisation

Pass database connection information to the shiphold factory

```Javascript
const shiphold = require('shiphold);
const sh = shiphold({
    hostname:'192.168.99.100'
    username:'docker',
    password:'docker,
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
    })
```

And start using the query builders.

```Javascript
Users
    .select('name','age')
    .where('name','Laurent')
    .run()
    .then(rows => {console.log(rows)}); // [{name:'Laurent',age:29}]
```
    
