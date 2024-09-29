import {useContext, useEffect, useState} from "react";
import {getAPI} from "../util.js";
import BlogPost from "../components/posts/BlogPost.jsx";
import {AuthContext} from "../contexts/AuthorisationContext.js";

export default function HomePage() {
    const [blogPosts, setBlogPosts] = useState([])
    const [tags, setTags] = useState([])
    const [errorMessage, setErrorMessage] = useState()
    const auth = useContext(AuthContext);

    useEffect(() => {
        const headers = {};
        if (auth) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + "/posts?sort=desc", {
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

    }, [])

    console.log(blogPosts, tags)
    return (
        <>
            {
                errorMessage ? <div>Error: {errorMessage}</div> : null
            }
            {
                blogPosts && blogPosts.map(post => {
                    return (<BlogPost key={post.id} {...post} knownTags={tags} preview={true}/>)
                })
            }

        </>
    )
}
