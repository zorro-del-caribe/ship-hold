DROP TABLE IF EXISTS posts, users, comments, tags, posts_tags CASCADE;

CREATE TABLE users (
    user_id serial PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    biography TEXT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL
);

CREATE TABLE posts(
    post_id serial PRIMARY KEY,
    title VARCHAR NOT NULL,
    content TEXT,
    published_at TIMESTAMP,
    user_id integer REFERENCES users (user_id)
);

CREATE TABLE comments(
    comment_id serial PRIMARY KEY,
    content TEXT,
    published_at TIMESTAMP,
    user_id integer REFERENCES users (user_id),
    post_id integer REFERENCES posts (post_id)
);

CREATE TABLE tags(
    tag VARCHAR PRIMARY KEY,
    description TEXT
);

CREATE TABLE posts_tags(
    post_id INTEGER REFERENCES posts,
    tag VARCHAR REFERENCES tags,
    PRIMARY KEY (post_id, tag)
);
