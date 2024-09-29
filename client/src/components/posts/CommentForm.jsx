import {useContext, useState} from "react";
import {getAPI} from "../../util.js";
import {AuthContext} from "../../contexts/AuthorisationContext.js";

export default function CommentForm({id}) {
    const [commentForm, setCommentForm] = useState({comment: ""});
    const auth = useContext(AuthContext);

    function handleFormChange(e) {
        setCommentForm({...commentForm, [e.target.name]: e.target.value});
    }

    function handleSubmission(e) {
        e.preventDefault();
        const headers = {};
        if (auth) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + `/posts/${id}/comments`, {
            method: "POST",
            headers: {
                ...headers,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(commentForm),
        }).then(res => {
            if (res.status === 200) {
                location.reload();
            }
        }).catch((err) => {
            console.log(err)
        })
    }

    return (
        <div className="comment-form">
            <form onSubmit={handleSubmission}>
                <div className="form-group">
                    <label htmlFor="comment-input">Comment</label>
                    <br/>
                    <textarea name={"comment"} value={commentForm.comment} onChange={handleFormChange}/>
                </div>
                <div className="form-group">
                    <button type="submit" className="">Submit</button>
                </div>
            </form>
        </div>
    )
}
