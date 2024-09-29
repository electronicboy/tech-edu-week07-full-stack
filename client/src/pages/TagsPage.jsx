import {useEffect, useState} from "react";
import {getAPI} from "../util.js";
import {Link} from "react-router-dom";

export default function TagsPage() {
    const [tags, setTags] = useState([]);

    useEffect(() => {
        fetch(getAPI() + "/tags", {}).then(res => res.json()).then(data => setTags(data));
    }, [])

    return (
        <ui>
            {tags && tags.map(tag => (<li key={tag.id}><Link to={`/?tag=${tag.id}`}>{tag.name}</Link></li>))}
        </ui>
    )

}
