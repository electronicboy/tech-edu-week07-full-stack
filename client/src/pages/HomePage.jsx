import {useEffect, useState} from "react";
import {getAPI} from "../util.js";
import BlogPost from "../components/posts/BlogPost.jsx";

export default function HomePage() {
    const [blogPosts, setBlogPosts] = useState([])
    const [errorMessage, setErrorMessage] = useState()
    useEffect(() => {
        fetch(getAPI() + "/posts").then((res) => {
            if (res.status === 200) {
                res.json().then((posts) => {setBlogPosts(posts)});
            } else {
                res.json().then((error) => {setErrorMessage(error.message)});
            }
        }).catch((error) => {
            setErrorMessage(error.message);
        })

    }, [])

    console.log(blogPosts)
    return (
        <>
            {
                errorMessage ? <div>Error: {errorMessage}</div> : null
            }
            {
                blogPosts && blogPosts.map(post => {
                    return (<BlogPost key={post.id} {...post} preview={true}/>)
                })
            }

        </>
    )
}
