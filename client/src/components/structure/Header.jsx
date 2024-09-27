import {Link} from "react-router-dom";

import './Header.css'
import {useContext} from "react";
import {AuthContext} from "../../contexts/AuthorisationContext.js";
import {getTokenProps} from "../../util.js";

export default function Header() {
    const auth = useContext(AuthContext);
    const hasToken = auth != null && auth.token;
    console.log("auth", auth)

    return (<header>
        <span>Cat&apos;s Bloggo</span>
        <nav>
            <div role={"navigation"}>
                <Link to={"/"}>Home</Link>
                <Link to={"/categories"}>Categories</Link>
                <Link to={"/categories"}>Users</Link>

            </div>
            <div role={"navigation"} className={"nav-right"}>
                {
                    hasToken ?
                        <Link to={"/logout"} className={"left"}>Hey, {getTokenProps(auth.token).username}</Link>
                        :
                        <>
                            <Link to={"/login"} className={"left"}>Login</Link>
                        </>
                }

            </div>
        </nav>
    </header>)
}
