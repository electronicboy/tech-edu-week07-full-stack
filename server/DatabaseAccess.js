import {Client} from "pg";

/** @type {Client |null} */
let pool = null;

export function getConnection() {
    if (pool == null || pool.closed) {
        pool = new Client({
            connectionString: process.env.DATABASE_URL,
        });
    }
    return pool;
}
