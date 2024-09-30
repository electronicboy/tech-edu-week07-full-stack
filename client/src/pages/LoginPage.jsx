import {AuthContext} from "../contexts/AuthorisationContext.js";
import {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {getAPI, objectPropsAsString} from "../util.js";
import './LoginPage.css'

export default function LoginPage({setAuth}) {
    const auth = useContext(AuthContext)
    const navigate = useNavigate()

    const [tab, setTab] = useState(0);

    const [loginFormData, setLoginFormData] = useState({username: "", password: ""})
    const [registerFormData, setRegisterFormData] = useState({username: "", password: ""})
    const [lastError, setLastError] = useState();

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
            processAuthResponse(res)
        }).catch((error) => {
            setLastError(error.message)
        })
    }

    function handleRegisterFormChange(e) {
        setRegisterFormData({...registerFormData, [e.target.name]: e.target.value})
    }

    function handleRegisterFormSubmit(e) {
        e.preventDefault()
        fetch(getAPI() + `/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(registerFormData),
        }).then(res => {
            processAuthResponse(res)
        }).catch((error) => {
            console.log("aaaa", error)
        })
    }

    /**
     *
     * @param {Response} res
     */
    function processAuthResponse(res) {
        if (res.status === 200) {
            res.json().then((auth) => {
                setAuth({token: auth.token})
            })
        } else {
            res.json().then((error) => {
                setLastError(error.error)
                console.log(error.error)
            })
        }
    }

    return (
        <>
            <div className={"form-holder"}>
                <div className={"form-header-selector"}>
                    <div className={tab === 0 ? "active" : ""} onClick={() => setTab(0)}>Login</div>
                    <div className={tab === 1 ? "active" : ""} onClick={() => setTab(1)}>register</div>
                </div>
                {tab === 0 && (
                    <>
                        <form onSubmit={handleLoginFormSubmit}>
                            <div className={"form-group"}>
                                <div className={"form-group-label"}>
                                    <label>username</label>
                                </div>
                                <div className={"form-group-input"}>
                                    <input name="username" type={"text"} autoComplete={"username"}
                                           onChange={handleLoginFormChange}/>
                                </div>
                            </div>
                            <div className={"form-group"}>
                                <div className={"form-group-label"}>
                                    <label>password</label>
                                </div>
                                <div className={"form-group-input"}>
                                    <input name="password" type={"password"} onChange={handleLoginFormChange}/>
                                </div>
                            </div>
                            <div className={"form-group"}>
                                <div className={"form-group-submit"}>
                                    <button type="submit" className={"primary"}>Login</button>
                                </div>
                            </div>
                        </form>
                    </>
                )}

                {tab === 1 && (
                    <>
                        <form onSubmit={handleRegisterFormSubmit}>
                            <div className={"form-group"}>
                                <div className={"form-group-label"}>
                                    <label>username</label>
                                </div>
                                <div className={"form-group-input"}>
                                    <input name="username" type={"text"} autoComplete={"username"}
                                           onChange={handleRegisterFormChange}/>
                                </div>
                            </div>
                            <div className={"form-group"}>
                                <div className={"form-group-label"}>
                                    <label>password</label>
                                </div>
                                <div className={"form-group-input"}>
                                    <input name="password" type={"password"} onChange={handleRegisterFormChange}/>
                                </div>
                            </div>
                            <div className={"form-group"}>
                                <div className={"form-group-submit"}>
                                    <button type="submit" className={"primary"}>Register</button>
                                </div>
                            </div>
                        </form>
                    </>
                )}
                {lastError && <div className={"form-error"}>{lastError}</div>}
            </div>
        </>
    )
}
