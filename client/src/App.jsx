import './App.css'
import Header from "./components/structure/Header.jsx";
import {useState} from "react";
import {AuthContext} from "./contexts/AuthorisationContext.js";
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostEditor from "./pages/PostEditor.jsx";
import LogoutPage from "./pages/LogoutPage.jsx";

function App() {

    const [auth, setAuth] = useState(() => {
        let item = localStorage.getItem("auth-token");
        if (item != null) {
            return JSON.parse(item)
        }
    });

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
                        <Route path={"/post/:id"} element={<BlogPage />} />
                        <Route path={"/create"} element={<PostEditor />}/>

                        <Route path={"/login"} element={<LoginPage setAuth={processLogin} />} />
                        <Route path={"/logout"} element={<LogoutPage setAuth={processLogin} />} />


                    </Routes>
                </div>
            </AuthContext.Provider>

        </>
    )
}

export default App
