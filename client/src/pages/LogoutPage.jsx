import {useContext} from "react";
import {AuthContext} from "../contexts/AuthorisationContext.js";

export default function LogoutPage({setAuth}) {
    const auth = useContext(AuthContext);
    function logOut() {

        setAuth(null);
    }
    return (<>
        {auth ? <button onClick={logOut}>Logout</button> : <div>You are logged out</div>}
    </>)
}
