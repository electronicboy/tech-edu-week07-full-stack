import bcrypt from 'bcrypt';
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import pg from "pg";
import {checkAuthHeader, validate} from "./utils.js";


dotenv.config();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "defaultdefaultdefault";

const app = express()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
})

app.use(express.json())
app.use(cors())

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
            console.log(err)
            return;
        }

        pool.query("INSERT INTO blog_users (username, password) VALUES ($1, $2) RETURNING id, username", [username, hash]).then((result) => {
            if (result.rowCount > 0) {
                res.status(200).json({message: "success!"})
            }
            console.log(result);
        }).catch((err) => {
            if (err.code === "23505") {
                res.status(500).json({error: "This name is already in use"})
                return;
            }

            console.log(err);
            res.status(500).json({error: "An internal error occurred"})
        })
    })
})

app.post("/auth/login", (req, res) => {
    const {username, password} = req.body;

    pool.query("SELECT id, username, password, admin, creator FROM blog_users WHERE username = $1", [username]).then((result) => {
        if (result.rowCount === 0) {
            res.status(403).json({error: "Invalid authentication request"});
            return null;
        } else {
            return result.rows[0]
        }
    }).then(user => {
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    res.status(200).json({
                        message: "success!", token: jwt.sign({
                            id: user.id, username: user.username, admin: user.admin, creator: user.creator
                        }, JWT_SECRET)
                    })
                } else {
                    res.status(403).json({error: "Invalid authentication request"});
                }
            })
        }
    }).catch((err) => {
        res.status(500).json({error: "An internal error occurred"});
        console.log(err)
    })

})

app.get("/posts", (req, res) => {
    //const {page, limit, sort} = req.query;
    let authHeader1 = checkAuthHeader(req.headers);

    authHeader1.then(user => {
        const userID = user != null ? user.userID : null;
        const admin = user != null && user.admin;

        pool.query(/* language=PostgreSQL */
            "SELECT posts.id, posts.title, posts.author, posts.created_at, posts.published_at, post, username FROM blog_posts AS posts INNER JOIN blog_users AS users ON posts.author = users.id")
            .then((results) => {
                if (results.rowCount === 0) {
                    return [];
                }

                let posts
                if (admin) {
                    posts = results.rows
                } else {
                    posts = results.rows.filter((post) => {
                        return post.published_at != null || post.author === userID
                    }).map((post) => ({
                        id: post.id,
                        title: post.title,
                        published_at: post.published_at,
                        post: post.post,
                        username: post.username,
                    }));
                }

                return posts;
            }).then(posts => {
            if (!posts) {
                res.status(404).json({message: "No posts found"});
            } else {
                res.status(200).json(posts);
            }
        }).catch((err) => {
            console.log(err)
            res.status(500).json({message: "An internal error occurred"});
        })
    })
})

app.post("/posts", (req, res) => {
    const {title, post, publish, tags} = req.body;

    checkAuthHeader(req.headers).then(user => {
        const canPost = user != null && (user.creator || user.admin);
        if (!canPost) {
            res.status(403).json({error: "Insufficent permissions"})
            return;
        }

        pool.connect().then(connection => {
            connection.query(/* language=PostgreSQL */ "BEGIN TRANSACTION").then(_ => {
                let insertionPromise = connection.query(/* language=PostgreSQL */
                    `INSERT INTO blog_posts (title, post, author, published_at)
                     VALUES ($1, $2, $3,
                             ${publish ? "now()" : "NULL"})
                     RETURNING id`, [title, post, user.userID]).then(result => {
                    if (result.rowCount === 0) {
                        throw new Error("Failed to insert")
                    }
                    return result.rows[0]

                });

                tags.forEach(/** {number} */tag => {
                    insertionPromise.then((result) => {
                        insertionPromise = connection.query(/* language=PostgreSQL */ "INSERT INTO blog_posts_tags (blog_post, blog_tag) VALUES ($1, $2)", [result.id, tag])
                    })
                })

                insertionPromise.then((_) => {
                    res.status(200).json({message: "success"})
                }).catch((err) => {
                    console.log(err)
                    res.status(500).json({error: "An internal error occurred"})
                    return connection.query("ROLLBACK TRANSACTION");
                }).then(_ => {
                    connection.release()
                })

            })
        })


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
        })


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
                    console.log(err)
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

    checkAuthHeader(req.headers).then(user => {
        pool.query(/* language=PostgreSQL */ "SELECT author, blog_posts.published_at FROM blog_posts WHERE id = $1", [id]).then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return;
            }

            const canModify = user.admin || result.rows[0].published_at != null || result.rows[0].author === user.userID;
            if (!canModify) {
                res.status(404).json({error: "Post not found"})
                return null;
            }

            return pool.query(/* language=PostgreSQL */ "INSERT INTO blog_posts_comments (author, comment, post_id) VALUES ($1, $2, $3)", [user.id, comment, post.id])

        }).then(result => {
            if (!result || result.rowCount === 0) {
                return;
            }

            res.status(200).json({message: "success"})
        })
    })
})

app.post("/posts/:id/comments", (req, res) => {
    const {comment} = req.body;

    checkAuthHeader(req.headers).then(user => {
        if (!user) {
            res.status(403).json({error: "Insufficient permissions"})
            return;
        }

        pool.query(/* language=PostgreSQL */ "SELECT author, published_at AS published FROM blog_posts WHERE id = ?", [comment.id])
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

            if (result.rowCount === 0) {
                res.status(404).json({error: "Post not found"})
                return;
            }
            res.status(200).json({message: "success"})
        })
    })
})


app.listen(PORT, () => {
    console.log(`Server is running on port http://0.0.0.0:${PORT}`);
})
