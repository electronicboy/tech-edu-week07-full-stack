import {Link} from "react-router-dom";

import './Header.css'
import {useContext} from "react";
import {AuthContext} from "../../contexts/AuthorisationContext.js";
import {getTokenProps} from "../../util.js";

export default function Header() {
    const auth = useContext(AuthContext);
    const hasToken = auth != null && auth.token;
    const tokenData = hasToken && getTokenProps(auth.token)
    const canCreatePosts = tokenData && (tokenData.admin || tokenData.creator)

    return (<header>
        <span>Cat&apos;s Bloggo</span>
        <nav>
            <div role={"navigation"}>
                <Link to={"/"}>Home</Link>
                <Link to={"/tags"}>tags</Link>

            </div>
            <div role={"navigation"} className={"nav-right"}>
                {
                    hasToken ?
                        (<>
                        <Link to={"/logout"}>Hey, {getTokenProps(auth.token).username}</Link>

                            {canCreatePosts && <Link to={"/create"}>Create a post</Link>}
                            </>
                        )
                        :
                        <>
                            <Link to={"/login"} className={"left"}>Login</Link>
                        </>
                }

            </div>
        </nav>
    </header>)
}
