import * as jose from 'jose'
export function getAPI() {
    return "http://localhost:8081"
}

/**
 *
 * @param {Date} date
 * @return {string} formatted date
 */
export function formatDate(date) {
    return date.toDateString()
}


/**
 *
 * @param {object} object
 * @returns {string} formatted
 */
export function objectPropsAsString(object) {
    let ret = "{"
    for (let prop in object) {
        ret += (prop + "=" + object[prop] + ",")
    }

    ret += "}"
    return ret;
}

export function getTokenProps(token) {
    console.log(token);
    if (token == null) return null;
    const decoded = jose.decodeJwt(token);

    if (typeof decoded === "object") return decoded;
    if (typeof decoded === "string") return JSON.parse(decoded);
    if (typeof decoded.payload === "string") return JSON.parse(decoded.payload);
    console.log("Failed to decode object? ", typeof decoded, decoded);
    throw Error("Failed to decode JWT");

}

export function canModifyPost(authToken, post) {
    if (!authToken) return false;
    const tokenProps = getTokenProps(authToken);

    if (tokenProps.admin) return true;
    if (tokenProps.userID === post.userID) return true;

    return false;


}
