import {createContext} from "react";

export const AuthContext = createContext(() => {
    const storedToken = localStorage.getItem("auth-token")
    if (storedToken) {
        return JSON.parse(storedToken)
    }
    return null;
})
