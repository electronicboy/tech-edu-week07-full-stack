import './Comments.css'
import CommentForm from "./CommentForm.jsx";
import {formatDate, getAPI, getTokenProps} from "../../util.js";
import {useContext} from "react";
import {AuthContext} from "../../contexts/AuthorisationContext.js";

export default function Comments({id, comments, refreshComments}) {

    const auth = useContext(AuthContext);

    console.log(comments);

    function canDelete(comment) {
        if (auth) {
            let tokenProps = getTokenProps(auth.token);
            console.dir(tokenProps)
            return tokenProps.admin || comment.author === tokenProps.id

        }
    }

    function deleteComment(comment) {
        const headers = {}
        if (auth.token) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + `/posts/${id}/comments/${comment.id}`, {
            method: "DELETE",
            headers: {
                ...headers,
                "Accept": "application/json"
            }
        }).then(res => {
            res.json().then(parsed => {
                if (res.status === 200) {
                    refreshComments()
                }
            })
        })

    }

    function genDelete(comment) {
        return (<button onClick={() => deleteComment(comment)}>␡</button>)


    }

    function processCommments() {
        if (comments == null) {
            return (<div>Loading...</div>)
        }
        if (comments.length === 0) {
            return <div>Nobody is here!</div>
        }

        return comments.map((comment, i) => (
            <div className="comment" key={i}>
                <div className={"comment-header"}>
                    <span>@{comment.username}</span> <span>{canDelete(comment) ? genDelete(comment) : ""}{formatDate(new Date(comment.date))}</span>
                </div>
                <div className={"comment-body"}>
                    <span>{comment.comment}</span>
                </div>
            </div>
        ))
    }


    return (
        <div className="comments">
            <CommentForm id={id} refreshComments={refreshComments} />
            {processCommments()}
        </div>
    )

}
