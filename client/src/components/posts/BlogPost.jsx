import PropTypes from "prop-types";
import {formatDate, getAPI} from "../../util.js";
import {useEffect, useState} from "react";
import './BlogPost.css'
import {Link, useNavigate} from "react-router-dom";

export default function BlogPost({id, title, published_at, post, username, preview}) {
    const navigate = useNavigate()
    const [comments, setComments] = useState([]);

    const onBlogPostClick = (e) => {
        e.preventDefault();
        if (preview) {
            navigate(`/post/${id}`, {})
        }
    }


    return (<div className="blog-post" onClick={(e) => onBlogPostClick(e)}>
        <h2>{title}</h2>
        <span className={"blog-post-byline"}>Published by <Link to={"/users/" +username} onClick={e => e.stopPropagation()}>{username}</Link> @ {formatDate(new Date(published_at))}</span>
        <br/>
        <p>{post}</p>
    </div>)
}

BlogPost.propTypes = {
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    published_at: PropTypes.string.isRequired,
    post: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    preview: PropTypes.bool
}
