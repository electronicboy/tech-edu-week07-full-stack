import './App.css'
import Header from "./components/structure/Header.jsx";
import {useEffect, useState} from "react";
import {AuthContext} from "./contexts/AuthorisationContext.js";
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostEditor from "./pages/PostEditor.jsx";
import LogoutPage from "./pages/LogoutPage.jsx";
import {getAPI, getTokenProps} from "./util.js";
import TagsPage from "./pages/TagsPage.jsx";

function App() {

    const [auth, setAuth] = useState(() => {
        let item = localStorage.getItem("auth-token");
        if (item != null) {
            return JSON.parse(item)
        }
        return null;
    });

    useEffect(() => {
        if (auth === null) return;

        async function refreshTokenIfNeeded() {

            const extractedToken = getTokenProps(auth.token);
            if (extractedToken.exp > Math.floor(Date() / 1000)) {
                const headers = {};
                if (auth.token) {
                    headers["Authorization"] = `Bearer ${auth.token}`;
                }
                const req = await fetch(getAPI() + "/auth/refresh", {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Accept": "application/json"
                    }
                })
                const obj = await req.json()
                if (req.status === 200) {
                    processLogin({token: obj.token})
                } else {
                    // Token is invalid at this point, yeet
                    processLogin(null)
                }
            }
        }

        refreshTokenIfNeeded();

    }, [auth])

    /**
     *
     * @param {object} token
     */
    function processLogin(token) {
        if (token === null) {
            localStorage.removeItem("auth-token");
            setAuth(null);
        } else {
            localStorage.setItem("auth-token", JSON.stringify(token));
            setAuth(token);
        }
    }


    return (
        <>
            <AuthContext.Provider value={auth}>
                <Header/>
                <div className="body-container">
                    <Routes>
                        <Route path={"/"} index={true} element={<HomePage/>}/>
                        <Route path={"/post/:id"} element={<BlogPage/>}/>
                        <Route path={"/create"} element={<PostEditor/>}/>
                        <Route path={"/tags"} element={<TagsPage/>}/>

                        <Route path={"/login"} element={<LoginPage setAuth={processLogin}/>}/>
                        <Route path={"/logout"} element={<LogoutPage setAuth={processLogin}/>}/>


                    </Routes>
                </div>
            </AuthContext.Provider>

        </>
    )
}

export default App
