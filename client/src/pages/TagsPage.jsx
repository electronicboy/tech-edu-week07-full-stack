import {useEffect, useState} from "react";
import {getAPI} from "../util.js";

export default function TagsPage() {
    const [tags, setTags] = useState([]);

    useEffect(() => {
        fetch(getAPI() + "/tags", {}).then(res => res.json()).then(data => setTags(data));
    }, [])
console.log(tags)
    return (
        <ui>
            {tags && tags.map(tag => (<li key={tag.id}>{tag.name}</li>))}
        </ui>
    )

}
