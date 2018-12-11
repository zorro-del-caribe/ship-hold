# Sample example application

Comparing fairly different data access libraries would be a bit complicated as the performances may vary for a wide range of reasons,
mainly related to the database itself:
the size of the tables, the indexes created, etc.
However in this folder you can find some real use cases for an example publishing platform, with implementations for various libraries. This is not a benchmark,
it is meant to give you a toy application to compare the different user experiences and test how (in)efficient queries with associations can be.
Therefore queries are monitored and execution time is measured.

The listed pretty common use cases are the following:

* Create a home page where we want to display the latest posts (10) including the three last published comments with their author's data, the tags related to each posts and the posts authors' data.
* Create a user profile page where we want to display the latest comments (5) of a given user including some reference data to the post in which the comment took place. We also want to get the five last posts published by the user including the tags for each post.
* Create a list of posts for a given tag. We want to list the five most recent posts including the data related to the author, and the three last comments.

Depending on the libraries you want to compare with, you would need to install its dependencies:

``npm install casual sequelize objection``
