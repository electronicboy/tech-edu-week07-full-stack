import './Comments.css'
import CommentForm from "./CommentForm.jsx";

export default function Comments({id, comments}) {

    console.log(comments);

    function processCommments() {
        if (comments == null) {
            return (<div>Loading...</div>)
        }
        if (comments.length === 0) {
            return <div>Nobody is here!</div>
        }

        return comments.map((comment, i) => (
            <div className="comment" key={i}>
                <span>{comment.username}</span>
                <span>{comment.comment}</span>
            </div>
        ))
    }


    return (
        <div className="comments">
            <CommentForm id={id} />
            {processCommments()}
        </div>
    )

}
