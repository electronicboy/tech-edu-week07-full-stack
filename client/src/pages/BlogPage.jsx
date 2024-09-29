import {useParams} from "react-router-dom";
import BlogPost from "../components/posts/BlogPost.jsx";
import {useContext, useEffect, useState} from "react";
import {getAPI} from "../util.js";
import {AuthContext} from "../contexts/AuthorisationContext.js";
import Comments from "../components/posts/Comments.jsx";

export default function BlogPage() {
    const auth = useContext(AuthContext);
    const {id} = useParams()
    const [post, setPost] = useState()
    const [comments, setComments] = useState();
    const [fetchError, setFetchError] = useState();
    const [knownTags, setKnownTags] = useState();


    useEffect(() => {
        const headers = {}
        if (auth) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + `/posts/${id}`, {
            headers: {
                ...headers,
                "Accept": "application/json",
            }
        }).then(res => {
            return res.json().then(comments => {
                if (res.status === 200) {
                    setPost(comments)
                    return true;
                } else {
                    setFetchError(comments.error)
                    return false;
                }
            })
        }).then(success => {
            console.log(success)
            if (!success) return null;
            return fetch(getAPI() + `/posts/${id}/comments`, {
                headers: {
                    ...headers,
                    "Accept": "application/json",
                }
            })
        }).then(res => {
            if (!res) {
                return;
            }
            res.json().then(comments => {
                console.log(comments)
                if (res.status === 200) {
                    setComments(comments)
                } else {
                    setFetchError(comments.error)
                }
            })
        })
    }, [])

    useEffect(() => {
        fetch(getAPI() + `/tags`, {}).then(res => {
            if (res.status === 200) {
                res.json().then(tags => {
                    setKnownTags(tags)
                })
            }
        })
    },[])


    return (<>
        {fetchError && <div><h3>{fetchError}</h3></div>}
        {post && <BlogPost  {...post} knownTags={knownTags} />}
        {post && <Comments comments={comments} id={id} />}
    </>)
}
