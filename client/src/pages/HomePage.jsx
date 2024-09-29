import {useContext, useEffect, useState} from "react";
import {getAPI} from "../util.js";
import BlogPost from "../components/posts/BlogPost.jsx";
import {AuthContext} from "../contexts/AuthorisationContext.js";
import {useSearchParams} from "react-router-dom";

export default function HomePage() {
    const [blogPosts, setBlogPosts] = useState([])
    const [tags, setTags] = useState([])
    const [knownTags, setKnownTags] = useState()
    const [errorMessage, setErrorMessage] = useState()
    const [sortMode, setSortMode] = useState("asc")
    const [searchParams, setSearchParams] = useSearchParams()
    const auth = useContext(AuthContext);

    function toggleSortMode() {
        setSortMode(curr => curr === "asc" ? "desc" : "asc")
    }

    useEffect(() => {
        const headers = {};
        if (auth) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + `/posts?sort=${sortMode}&tag=${searchParams.get("tag") ? searchParams.get("tag") : ""}`, {
            headers: {
                ...headers,
                "Accept": "application/json",
            }
        }).then((res) => {
            if (res.status === 200) {
                res.json().then((posts) => {setBlogPosts(posts)});
            } else {
                res.json().then((error) => {setErrorMessage(error.message)});
            }
        }).catch((error) => {
            setErrorMessage(error.message);
        }).then(_ => {
            return fetch(getAPI() + "/tags", {})
        }).then(res => res.json()).then(data => {setTags(data)});

    }, [sortMode, searchParams])

    useEffect(() => {
        fetch(getAPI() + `/tags`, {}).then(res => {
            if (res.status === 200) {
                res.json().then(tags => {
                    setKnownTags(tags)
                })
            }
        })
    },[])

    return (
        <>
            {
                errorMessage ? <div>Error: {errorMessage}</div> : null
            }
            {/*{blogPosts && <button onClick={() => toggleSortMode()}>Toggle Sort Mode</button>}*/}
            {
                blogPosts && blogPosts.map(post => {
                    return (<BlogPost key={post.id} {...post} knownTags={knownTags} preview={true}/>)
                })
            }

        </>
    )
}
