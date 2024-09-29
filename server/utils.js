import jwt from 'jsonwebtoken';
import {getJWTToken} from "./config.js";

/**
 * @namespace User
 * @property {number} id user ID
 * @property {string} username username
 * @property {boolean} admin if the user is an admin
 * @property {boolean} creator if the user is a creator
 */


/**
 *
 * @param {string} value value to test
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {boolean} returns if the value passed in follows the provided constraints
 */
export function validate(value, minLength, maxLength) {
    if (!value) return false;
    if (!minLength && minLength > value.length) return false;
    if (!maxLength && maxLength < value.length) return false;

    return true;
}


/**
 *
 * @param {IncomingHttpHeaders} headers
 * @returns {Promise<{userID: number, admin: boolean, creator: boolean}| null>}
 */
export function checkAuthHeader(headers) {
    return new Promise((resolve, reject) => {
        let authorisation = headers["authorization"]

        try {
            if (authorisation) {
                const token = extractJWT(authorisation.slice(authorisation.indexOf(" ")).trim(), getJWTToken());
                if (token) {
                    resolve({
                        userID: token.id,
                        admin: token.admin,
                        creator: token.creator
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
        resolve(null)
    })
}

/**
 *
 * @param token
 * @param secret
 * @returns {User}
 */
export function extractJWT(token, secret) {
    if (token == null) return null;
    try {
        console.log("aa", token)
        if (jwt.verify(token, secret, {clockTolerance: 60 * 30 /* 30 mins*/}) === false) {
            return null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }

    const decoded = jwt.decode(token, secret)
    if (typeof decoded === "object") return decoded;
    if (typeof decoded === "string") return JSON.parse(decoded);
    if (typeof decoded.payload === "string") return JSON.parse(decoded.payload);
    console.log("Failed to decode object? ", typeof decoded, decoded);
    throw Error("Failed to decode JWT");
}
