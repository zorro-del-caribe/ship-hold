const Sequelize = require('sequelize');

const seq = new Sequelize('postgres://docker:docker@localhost/ship-hold-bench', {logging: false});

const options = {underscored: true, timestamps: false};
const Users = seq.define('users', {
    user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    first_name: Sequelize.STRING,
    last_name: Sequelize.STRING,
    biography: Sequelize.STRING,
    email: Sequelize.STRING,
}, options);

const Posts = seq.define('posts', {
    post_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    title: Sequelize.STRING,
    content: Sequelize.STRING,
    published_at: Sequelize.DATE,
    user_id: Sequelize.INTEGER
}, options);

const Comments = seq.define('comments', {
    comment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    }, content: Sequelize.STRING,
    published_at: Sequelize.DATE,
    user_id: {
        type: Sequelize.INTEGER
    },
    post_id: {
        type: Sequelize.INTEGER
    }
}, options);

const Tags = seq.define('tags', {
    tag: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    description: Sequelize.STRING
}, options);

const PostsTags = seq.define('posts_tags', {
    tag: {
        type: Sequelize.STRING
    },
    post_id: {
        type: Sequelize.INTEGER
    }
}, options);

Posts.belongsTo(Users, {foreignKey: 'user_id'});
Users.hasMany(Posts, {foreignKey: 'user_id'});

Posts.hasMany(Comments, {foreignKey: 'post_id'});
Comments.belongsTo(Posts, {foreignKey: 'post_id'});

Users.hasMany(Comments, {foreignKey: 'user_id'});
Comments.belongsTo(Users, {foreignKey: 'user_id'});

Tags.belongsToMany(Posts, {through: PostsTags, foreignKey: 'tag'});
Posts.belongsToMany(Tags, {through: PostsTags, foreignKey: 'post_id'});

exports.seq = seq;
exports.Users = Users;
exports.Posts = Posts;
exports.Comments = Comments;
exports.Tags = Tags;
