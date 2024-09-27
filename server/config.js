import dotenv from "dotenv";

dotenv.config();

let databaseString = process.env.DATABASE_URL;
let jwtToken = process.env.JWT_SECRET || "defaultdefaultdefault";

export function getDatabaseString() {
    return databaseString;
}

export function getJWTToken() {
    return jwtToken;
}

