import PropTypes from "prop-types";
import {formatDate, getAPI} from "../../util.js";
import {useEffect, useState} from "react";
import './BlogPost.css'
import {Link, useNavigate} from "react-router-dom";

export default function BlogPost({id, title, published_at, post, username, preview, tags, knownTags}) {
    const navigate = useNavigate()
    const [comments, setComments] = useState([]);

    const onBlogPostClick = (e) => {
        e.preventDefault();
        if (preview) {
            navigate(`/post/${id}`, {})
        }
    }

    function populateTags() {
        return tags.map(tag => {
            const found = knownTags.find((test) => test.id === tag);
            if (found) {
                return (<span  key={tag.id} className={"blog-post-tag"}>{found.name}</span>)
            } else {
                return (<></>)
            }
        })
    }

    // https://www.reddit.com/r/css/comments/11ekwhy/fading_the_content_at_the_bottom_of_div_element/
    return (
        <div className={"blog-post " + (preview ? "blog-post-preview" : "blog-post-full")}
             onClick={(e) => onBlogPostClick(e)}>
            <div className={"blog-post-header"}>
                <h2 style={{display: "inline"}}>{title}</h2> {!preview && knownTags && tags && populateTags()}
            </div>
            {/* <Link to={"/users/" +username} onClick={e => e.stopPropagation()}>{username}</Link> */}
            {
                published_at ? (
                        <span className={"blog-post-byline"}>Published by <span
                            className={"blog-post-author"}>{username}</span> @ {formatDate(new Date(published_at))}</span>
                ) :
                    (
                        <span className={"blog-post-byline"}>by <span
                            className={"blog-post-author"}>{username}</span></span>
                    )
            }

            <br/>
            <span style={{whiteSpace: "pre-wrap"}}>{post}</span>
        </div>)
}

BlogPost.propTypes = {
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    published_at: PropTypes.string,
    post: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    preview: PropTypes.bool,
    knownTags: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    }))
}
