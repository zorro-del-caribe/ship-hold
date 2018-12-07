const {Model} = require('objection');
const {hostname: host, username: user, password, database} = require('../config/db');

const knex = require('knex')({
    client: 'pg',
    connection: {
        host,
        user,
        password,
        database
    },
    // debug:true
});

// Give the knex object to objection.
Model.knex(knex);

// Person model.
class User extends Model {
    static get tableName() {
        return 'users';
    }

    static get idColumn() {
        return 'user_id';
    }

    static get relationMappings() {
        return {
            posts: {
                relation: Model.HasManyRelation,
                modelClass: Post,
                join: {
                    from: 'users.user_id',
                    to: 'posts.user_id'
                }
            },
            comments: {
                relation: Model.HasManyRelation,
                modelClass: Comment,
                join: {
                    from: 'users.user_id',
                    to: 'comments.user_id'
                }
            }
        };
    }
}

class Post extends Model {
    static get tableName() {
        return 'posts';
    }

    static get idColumn() {
        return 'post_id';
    }

    static get relationMappings() {
        return {
            author: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'posts.user_id',
                    to: 'users.user_id'
                }
            },
            comments: {
                relation: Model.HasManyRelation,
                modelClass: Comment,
                join: {
                    from: 'posts.post_id',
                    to: 'comments.post_id'
                }
            },
            tags: {
                relation: Model.ManyToManyRelation,
                modelClass: Tag,
                join: {
                    from: 'posts.post_id',
                    through: {
                        from: 'posts_tags.post_id',
                        to: 'posts_tags.tag'
                    },
                    to: 'tags.tag'
                }
            }
        };
    }
}

class Comment extends Model {
    static get tableName() {
        return 'comments';
    }

    static get idColumn() {
        return 'comment_id';
    }

    static get relationMappings() {
        return {
            author: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'comments.user_id',
                    to: 'users.user_id'
                }
            },
            post: {
                relation: Model.BelongsToOneRelation,
                modelClass: Post,
                join: {
                    from: 'comments.post_id',
                    to: 'posts.post_id'
                }
            }
        };
    }
}

class Tag extends Model {
    static get tableName() {
        return 'tags';
    }

    static get idColumn() {
        return 'tag';
    }

    static get relationMappings() {
        return {
            posts: {
                relation: Model.ManyToManyRelation,
                modelClass: Post,
                join: {
                    from: 'tags.tag',
                    through: {
                        from: 'posts_tags.tag',
                        to: 'posts_tags.post_id'
                    },
                    to: 'posts.post_id'
                }
            }
        };
    }
}

exports.User = User;
exports.Post = Post;
exports.knex = knex;
exports.Tag = Tag;
