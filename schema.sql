CREATE TABLE IF NOT EXISTS blog_users
(
    id       INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name     VARCHAR(255) NOT NULL UNIQUE,
    -- https://stackoverflow.com/questions/5881169/what-column-type-length-should-i-use-for-storing-a-bcrypt-hashed-password-in-a-d
    -- We're probably not going to actually utilise this, but, you know...
    password CHAR(60),
    -- real world apps might have a more refined security system, but, simples
    admin    BOOLEAN DEFAULT false,
    creator  BOOLEAN DEFAULT false
    );

CREATE TABLE IF NOT EXISTS blog_posts
(
    id           INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title        VARCHAR(255) NOT NULL,
    post         TEXT         NOT NULL,
    author       INT          NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    published_at TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS blog_tags
(
    id   INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(60) NOT NULL
    );

CREATE TABLE IF NOT EXISTS blog_posts_tags
(
    blog_post INT REFERENCES blog_posts (id),
    blog_tag  INT REFERENCES blog_tags (id)
    );

CREATE TABLE IF NOT EXISTS blog_posts_comments
(
    id          INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id     INT REFERENCES blog_posts (id) NOT NULL,
    author      INT REFERENCES blog_users (id) NOT NULL,
    date        TIMESTAMP                      NOT NULL DEFAULT now(),
    comment     TEXT                           NOT NULL,
    last_edited TIMESTAMP
    );
