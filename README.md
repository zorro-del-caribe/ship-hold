# Ship-hold

[![CircleCI](https://circleci.com/gh/zorro-del-caribe/ship-hold.svg?style=svg)](https://circleci.com/gh/zorro-del-caribe/ship-hold)
[![Gitter](https://badges.gitter.im/zorro-del-caribe/ship-hold.svg)](https://gitter.im/zorro-del-caribe/ship-hold?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

<div align="center">
	<div>
		<img width="400" width="400" src="docs/resources/ship-hold-logo.svg" alt="ship-hold logo">
	</div>
</div>

**ship-hold** is a small and fast data access framework for [Postgres](https://www.postgresql.org) relational database, developed for the
[Nodejs](https://nodejs.org/) environment.

It is based around intuitive SQL query builders which mirror closely the SQL syntax
while keeping the flexibility functions may have.
It also allows you to create convenient services and relations between them in order to easily fetch related resources (aka eager loading).
It is actually the **only** library I know of which has it right when it comes to pagination and nested pagination!

It differs a lot from other popular libraries so called ORM such
[Sequelize](http://docs.sequelizejs.com/) or [Bookshelf](http://bookshelfjs.org/).
They come with a wide range of features:
schema management, migrations, validations, different sql dialects, model instances, etc. But it comes at the price of very complex API's / code base
(we are usually talking about more than 200 API functions and more than 10/20 thousands source lines of code).
Ship-hold, however, focuses on a limited set of features while remaining extensible.

Visit the [Documentation website](https://ship-hold.com) for more details
