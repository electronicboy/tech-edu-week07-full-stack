import {AuthContext} from "../contexts/AuthorisationContext.js";
import {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {getAPI, objectPropsAsString} from "../util.js";

export default function LoginPage({setAuth}) {
    const auth = useContext(AuthContext)
    const navigate = useNavigate()

    const [loginFormData, setLoginFormData] = useState({username: "", password: ""})
    const [registerFormData, setRegisterFormData] = useState({username: "", password: ""})

    useEffect(() => {
        if (auth) {
            navigate("/");
        }
    }, [auth])

    if (auth) {
        return (<></>)
    }

    function handleLoginFormChange(e) {
        setLoginFormData({...loginFormData, [e.target.name]: e.target.value})
        console.log("handleLoginFormChange", e);
    }

    function handleLoginFormSubmit(e) {
        e.preventDefault()
        fetch(getAPI() + `/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginFormData),
        }).then(res => {
            console.log(res.status)
            if (res.status === 200) {
                res.json().then((auth) => {
                    setAuth({token: auth.token})
                })
            } else {
                res.json().then((error) => {
                    console.log(error.error)
                })
            }
        }).catch((error) => {
            console.log("aaaa", error)
        })
    }

    function handleRegisterFormChange(e) {
        setLoginFormData({...loginFormData, [e.target.name]: e.target.value})
    }

    function handleRegisterFormSubmit(e) {
        e.preventDefault()
        fetch(getAPI() + `/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginFormData),
        }).then(res => {
            console.log(res.status)
            if (res.status === 200) {
                res.json().then((auth) => {
                    setAuth({token: auth.token})
                })
            } else {
                res.json().then((error) => {
                    console.log(error.error)
                })
            }
        }).catch((error) => {
            console.log("aaaa", error)
        })
    }

    return (
        <>
            <span>{objectPropsAsString(loginFormData)}</span>
            <form onSubmit={handleLoginFormSubmit}>
                <label>username</label>
                <input name="username" type={"text"} autoComplete={"username"} onChange={handleLoginFormChange}/>
                <label>password</label>
                <input name="password" type={"password"} onChange={handleLoginFormChange}/>
                <button type="submit">Login</button>
            </form>

            <form onSubmit={handleRegisterFormSubmit}>
                <label>username</label>
                <input name="username" type={"text"} autoComplete={"username"} onChange={handleRegisterFormChange}/>
                <label>password</label>
                <input name="password" type={"password"} onChange={handleRegisterFormChange}/>
                <button type="submit">Register</button>
            </form>
        </>
    )
}
