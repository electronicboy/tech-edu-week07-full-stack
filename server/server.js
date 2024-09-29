import bcrypt from 'bcrypt';
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import pg from "pg";
import winston from "winston";
import {checkAuthHeader, validate} from "./utils.js";
import {getDatabaseString, getJWTToken} from "./config.js";

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ]
})


dotenv.config();
const PORT = process.env.PORT || 8080;

const app = express()

const pool = new pg.Pool({
    connectionString: getDatabaseString(),
})

app.use(express.json())
app.use(cors())

// https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/#logging-in-an-express-application-using-winston-and-morgan
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {

            // Configure Morgan to use our custom logger with the http severity
            write: (message) => logger.http(message.trim()),
        },
    }
);

app.use(morganMiddleware);

/*****************************
 * AUTH
 *****************************/

app.post("/auth/register", (req, res) => {
    const {username, password} = req.body;
    if (!validate(username, 3, 40)) {
        res.status(400).json({error: "Username does not meet the requirements"});
        return;
    }

    if (!validate(password, 3, 40)) {
        res.status(400).json({error: "Password does not meet the requirements"});
        return;
    }

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            res.status(500).json({error: "An internal error occurred"})
            logger.error(err)
            return;
        }

        pool.query("INSERT INTO blog_users (username, password) VALUES ($1, $2) RETURNING id, username, admin, creator", [username, hash]).then((result) => {
            if (result.rowCount > 0) {
                let user = result.rows[0];
                res.status(200).json({
                    message: "success!", token: jwt.sign({
                        id: user.id, username: user.username, admin: user.admin, creator: user.creator,
                        iat: Math.floor(Date() / 1000), exp: Number(Math.floor(new Date().getTime() / 1000 + (60 * 60 /*1 hour*/)))
                    }, getJWTToken())
                })
                return;
            }
            throw new Error("The server entered an unexpected state")
        }).catch((err) => {
            if (err.code === "23505") {
                res.status(500).json({error: "This name is already in use"})
                return;
            }

            logger.error(err);
            res.status(500).json({error: "An internal error occurred"})
        })
    })
})

app.post("/auth/refresh", (req, res) => {
    checkAuthHeader(req.headers).then(user => {

        pool.query("SELECT id, username, password, admin, creator FROM blog_users WHERE id = $1", [user.userID]).then((result) => {
            console.log(result);
            if (result.rowCount === 0) {
                return null;
            } else {
                return result.rows[0]
            }
        }).then(lookup => {
            if (lookup) {
                res.status(200).json({
                    message: "success!", token: jwt.sign({
                        id: lookup.id, username: lookup.username, admin: lookup.admin, creator: lookup.creator,
                        iat: Math.floor(Date() / 1000), exp: Number(Math.floor(new Date().getTime() / 1000 + (60 * 60 /*1 hour*/)))
                    }, getJWTToken())
                })
            }
        }).catch((err) => {
            res.status(403).json({error: "Failed to refresh token"})
            console.log("aaa", err)
            logger.error(err);
        })
    }).catch((err) => {
        logger.error(err);
        res.status(500).json({error: "An internal error occurred"})
    })
})

app.post("/auth/login", (req, res) => {
    const {username, password} = req.body;

    pool.query("SELECT id, username, password, admin, creator FROM blog_users WHERE username = $1", [username]).then((result) => {
        console.log(result);
        if (result.rowCount === 0) {
            return null;
        } else {
            return result.rows[0]
        }
    }).then(user => {
        console.log(user);
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    res.status(200).json({
                        message: "success!", token: jwt.sign({
                            id: user.id, username: user.username, admin: user.admin, creator: user.creator,
                            iat: Number(Math.floor(Date() / 1000)), exp: Number(Math.floor(new Date().getTime() / 1000 + (60 * 60 /*1 hour*/)))
                        }, getJWTToken())
                    })
                } else {
                    res.status(403).json({error: "Invalid authentication request"});
                }
            })
        } else {
            res.status(403).json({error: "Invalid authentication request"});
        }
    }).catch((err) => {
        logger.error(err);
        res.status(500).json({error: "An internal error occurred"});
    })

})

app.get("/posts", (req, res) => {
    //const {page, limit} = req.query;
    const {sort, tag} = req.query;
    let parsedTag;
    if (tag) {
        try {
            parsedTag = JSON.parse(tag);
        } catch (err) {
            res.status(400).json({error: "invalid tag value"})
            return;
        }
    }

    let sortQueryInsert = null;
    if (!sort || sort.toLowerCase() === "desc") {
        sortQueryInsert = " ORDER BY created_at DESC";
    } else if (sort.toLowerCase() === "asc") {
        sortQueryInsert = " ORDER BY created_at ASC";
    }

    let authHeader1 = checkAuthHeader(req.headers);
    console.log(1)

    authHeader1.then(user => {
        const userID = user != null ? user.userID : null;
        const admin = user != null && user.admin;

        pool.query(/* language=PostgreSQL */
            `SELECT posts.id,
                    posts.title,
                    posts.author,
                    posts.created_at,
                    posts.published_at,
                    post,
                    users.username,
                    coalesce(array_agg(tags.blog_tag), '{}') AS tags
             FROM blog_posts AS posts
                      INNER JOIN blog_users AS users ON posts.author = users.id
                      LEFT JOIN blog_posts_tags AS tags ON tags.blog_post = posts.id
             GROUP BY posts.id, users.username, posts.title, posts.author, posts.created_at, posts.published_at, post,
                      posts.id${sortQueryInsert ? sortQueryInsert : ""}`)
            .then((results) => {
                if (results.rowCount === 0) {
                    return null;
                }
                let posts = results.rows;
                logger.info(JSON.stringify(posts));
                logger.info(JSON.stringify(parsedTag));
                if (parsedTag) {
                    posts = posts.filter(post => post.tags && post.tags.includes(parsedTag));
                    logger.info(JSON.stringify(posts));
                }

                if (admin) {
                    posts = posts.map(post => {
                        if (post.tags && post.tags[0] === null) {
                            return {
                                ...post,
                                tags: null
                            }
                        }
                        return post;

                    })
                } else {
                    posts = posts.filter((post) => {
                        return post.published_at != null || post.author === userID
                    }).map((post) => {
                        const ret = {
                            id: post.id,
                            title: post.title,
                            published_at: post.published_at,
                            post: post.post,
                            username: post.username,
                        }
                        if (post.tags.length > 0 && post.tags[0]) {
                            ret.tags = post.tags;
                        }
                        return ret;

                    });
                }

                return posts;
            }).then(posts => {
            if (!posts) {
                res.status(404).json({error: "No posts found"});
            } else {
                res.status(200).json(posts);
            }
        }).catch((err) => {
            console.log(err)
            res.status(500).json({error: "An internal error occurred"});
        })
    }).catch((err) => {
        logger.error(err)
    })
})

app.get("/posts/:id", (req, res) => {
    const {id} = req.params;
    let authHeader1 = checkAuthHeader(req.headers);


    authHeader1.then(user => {
        const userID = user != null ? user.userID : null;
        const admin = user != null && user.admin;

        pool.query(/* language=PostgreSQL */
            `SELECT posts.id,
                    posts.title,
                    posts.author,
                    posts.created_at,
                    posts.published_at,
                    post,
                    users.username,
                    coalesce(array_agg(tags.blog_tag), '{}') AS tags
             FROM blog_posts AS posts
                      INNER JOIN blog_users AS users ON posts.author = users.id
                      LEFT JOIN blog_posts_tags AS tags
                                ON tags.blog_post = posts.id
             WHERE posts.id = $1
             GROUP BY posts.id, users.username, posts.title, posts.author, posts.created_at, posts.published_at, post,
                      posts.id`, [id])
            .then((results) => {
                if (results.rowCount === 0) {
                    return null;
                }

                let sourcePost = results.rows[0];
                let post = {}
                console.log(sourcePost);
                if (!admin) {
                    post = {...sourcePost}
                } else {
                    post = {
                        id: sourcePost.id,
                        title: sourcePost.title,
                        published_at: sourcePost.published_at,
                        post: sourcePost.post,
                        username: sourcePost.username,
                        tags: sourcePost.tags,
                    }
                }

                if (post.tags.length > 0 && sourcePost.tags[0] === null) {
                    post.tags = null;
                }


                return post;

            }).then(posts => {
            if (!posts) {
                res.status(404).json({error: "No posts found"});
            } else {
                res.status(200).json(posts);
            }
        }).catch((err) => {
            console.log(err)
            res.status(500).json({error: "An internal error occurred"});
        })
    }).catch((err) => {
        console.log(err)
    })

})

app.post("/posts", (req, res) => {
    const {title, post, publish, tags, extraTags} = req.body;
    console.log(req.body)
    if (!title) {
        res.status(400).json({error: "Missing title"});
        return;
    }
    if (!post) {
        res.status(400).json({error: "Missing post"});
        return;
    }

    checkAuthHeader(req.headers).then(user => {
        const canPost = user != null && (user.creator || user.admin);
        if (!canPost) {
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }
        let newPostId = -1;

        pool.connect().then(connection => {
            connection.query(/* language=PostgreSQL */ "BEGIN TRANSACTION").then(_ => {
                connection.query(/* language=PostgreSQL */
                    `INSERT INTO blog_posts (title, post, author, published_at)
                     VALUES ($1, $2, $3,
                             ${publish ? "now()" : "NULL"})
                     RETURNING id`, [title, post, user.userID]).then(result => {
                    if (result.rowCount === 0) {
                        throw new Error("Failed to insert")
                    }
                    return result.rows[0]

                }).then(({id}) => {
                    newPostId = id;

                    async function insertTags() {
                        for (let i = 0; i < extraTags.length; i++) {
                            const extraTag = extraTags[i]
                            const res = await connection.query(/* language=PostgreSQL */ "INSERT INTO blog_tags (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id", [extraTag])
                            if (res.rowCount === 1) {
                                tags.push(res.rows[0].id)
                            }
                        }

                        for (let i = 0; i < tags.length; i++) {
                            const tag = tags[i];
                            await connection.query(/* language=PostgreSQL */ "INSERT INTO blog_posts_tags (blog_post, blog_tag) VALUES ($1, $2) RETURNING (blog_post, blog_tag)", [id, tag]).then(result => {
                                console.log(result)
                            })
                        }
                    }

                    return insertTags()
                }).then(_ => {
                    return connection.query("COMMIT TRANSACTION")
                }).then((_) => {
                    res.status(200).json({message: "success", id: newPostId})
                }).catch((err) => {
                    console.log(err)
                    res.status(500).json({error: "An internal error occurred"})
                    return connection.query("ROLLBACK TRANSACTION");
                }).then(_ => {
                    connection.release()
                })

            })
        })


    }).catch((err) => {
        logger.error(err)
    })
})

app.post("/posts/:id/published", (req, res) => {
    const {id} = req.params;
    const {newState} = req.query;
    checkAuthHeader(req.headers).then(user => {
        if (!user) {
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }

        pool.query(/* language=PostgreSQL */ "SELECT author, published_at AS published FROM blog_posts WHERE id = $1", [id]).then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return null;
            }
            const post = result.rows[0];

            const canModify = user.admin || post.author === user.userID
            if (!canModify) {
                res.status(404).json({error: "Post not found"})
                return null;
            }
            // if post is published and new state is not published, or, published and new state is published, no state change
            if ((post.published == null && !newState) || (post.published && newState)) {
                res.status(409).json({error: "The post is already in the desired state"})
                return;
            }

            return pool.query(/* language=PostgreSQL */ "UPDATE blog_posts SET published_at = $1 WHERE id = $2", [newState ? Date() : null, id])
        }).then(result => {
            if (result === null) {
                return null;
            }
            if (result.rowCount === 0) {
                res.status(409).json({error: "failed to perform update"})
                return null;
            }

            res.status(200).json({message: "success"})
        }).catch((err) => {
            logger.error(err)
        })


    }).catch((err) => {
        logger.error(err)
    })
})


app.delete("/posts/:id", (req, res) => {
    const {id: postID} = req.params;
    checkAuthHeader(req.headers).then(user => {
        if (!user) {
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }

        pool.connect().then((connection) => {
            connection.query("SELECT * FROM blog_posts WHERE id = ?", [postID]).then((result) => {
                if (result.rowCount === 0) {
                    res.status(404).json({error: "Post not found"})
                    return null;
                }

                return result.rows[0]
            }).then(post => {
                if (!post) {
                    return null;
                }
                const canModify = post.author === user.userID || user.admin;
                if (!canModify) {
                    res.status(403).json({error: "Insufficient permissions"})
                    return null;
                }

                connection.query(/* language=PostgreSQL */ "BEGIN TRANSACTION").then(_ => {
                    // comments
                    return connection.query(/* language=PostgreSQL */ "DELETE FROM blog_posts_comments WHERE post_id = $1", [post.id])
                }).then((_) => {
                    // tags
                    return connection.query(/* language=PostgreSQL */ "DELETE FROM blog_posts_tags WHERE blog_post = ?", [post.id])
                }).then((_) => {
                    // posts
                    return connection.query(/* language=PostgreSQL */ "DELETE FROM blog_posts WHERE id = ? ", [post.id])
                }).then((_) => {
                    // success! commit
                    res.status(200).json({message: "success"})
                    return connection.query(/* language=PostgreSQL */ "COMMIT TRANSACTION")
                }).catch((err) => {
                    // derp
                    res.status(500).json({error: "An internal error occurred"});
                    logger.error(err)
                    return connection.query(/* language=PostgreSQL */ "ROLLBACK TRANSACTION")
                }).then((_) => {
                    // release
                    connection.release()
                })
            })
        })
    })
})


app.get("/posts/:id/comments", (req, res) => {
    const {id} = req.params;

    logger.info("test")
    checkAuthHeader(req.headers).then(user => {
        pool.query(/* language=PostgreSQL */ "SELECT author, blog_posts.published_at FROM blog_posts WHERE id = $1", [id]).then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return;
            }

            const canView = (user != null && user.admin) || result.rows[0].published_at != null || (user != null && result.rows[0].author === user.userID);
            if (!canView) {
                res.status(404).json({error: "Post not found"})
                return null;
            }

            return pool.query(/* language=PostgreSQL */ "SELECT blog_posts_comments.id, author, comment, date, users.username as username FROM blog_posts_comments INNER JOIN blog_users as users ON blog_posts_comments.author = users.id WHERE post_id = $1", [id])

        }).then(result => {
            if (!result) {
                return
            }

            res.status(200).json(result.rows)
        }).catch((err) => {
            logger.error(err)
        })
    }).catch((err) => {
        logger.error(err)
    })
})

app.post("/posts/:id/comments", (req, res) => {
    const {comment} = req.body;
    const {id} = req.params;

    checkAuthHeader(req.headers).then(user => {
        if (!user) {
            logger.debug(`${req.path} - no user `)
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }

        pool.query(/* language=PostgreSQL */ "SELECT id, author, published_at AS published FROM blog_posts WHERE id = $1", [id])
            .then((result) => {
                if (result.rowCount === 0) {
                    res.status(404).json({error: "Post not found"})
                    return;
                }

                const post = result.rows[0]

                const canComment = post.published != null || user.admin

                if (!canComment) {
                    // Technically, 403, but, prevent discovery
                    res.status(404).json({error: "Post not found"})
                    return;
                }
                return pool.query(/* language=PostgreSQL */ "INSERT INTO blog_posts_comments (author, comment, post_id) VALUES ($1, $2, $3)", [user.userID, comment, post.id])
            }).then((result) => {
            if (!result) {
                return;
            }

            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return;
            }
            res.status(200).json({message: "success"})
        }).catch((err) => {
            logger.error(err)
        })
    }).catch((err) => {
        logger.error(err)
    })
})

app.delete("/posts/:id/comments/:commentId", (req, res) => {
    const {id, commentId} = req.params;

    checkAuthHeader(req.headers).then(user => {
        if (!user) {
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }

        pool.query( /* language=PostgreSQL */ "SELECT bpc.author AS author FROM blog_posts INNER JOIN public.blog_posts_comments bpc on blog_posts.id = bpc.post_id WHERE blog_posts.id = $1 AND bpc.id = $2 ", [id, commentId]).then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return;
            }
            return result.rows[0]
        }).then(post => {
            const canDelete = user.admin || user.userID === post.author

            if (!canDelete) {
                // spoofing...
                res.status(404).json({error: "Post not found"})
                return;
            }

            return pool.query( /* language=PostgreSQL */ "DELETE FROM blog_posts_comments WHERE id = $1", [commentId])
        }).then(post => {
            if (post) {
                if (post.rowCount > 0) {
                    res.status(200).json({message: "Comment deleted"})
                    return;
                } else {
                    // weird state
                    if (!res.headersSent) {
                        res.status(500).json({error: "Internal Server Error"})
                    }
                }
            }
        })



    }).catch((err) => {
        logger.error(err)
        res.status(500).json({error: "Internal Server Error"})
    })
})

app.get("/tags", (req, res) => {
    pool.query(/* language=PostgreSQL */ "SELECT id, name FROM blog_tags").then((result) => {
        return res.status(200).json(result.rows.map(tag => (
            {
                id: tag.id,
                name: tag.name,
            }
        )))
    }).catch((err) => {
        logger.error(err)
    })
})


app.listen(PORT, () => {
    console.log(`Server is running on port http://0.0.0.0:${PORT}`);
})
