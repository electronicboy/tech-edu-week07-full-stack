import {useEffect, useState} from "react";
import {getAPI} from "../util.js";

export default function CreatePostPage() {
    const [postForm, setPostForm] = useState({title: "", publish: false, post: "", tags: []});
    const [tags, setTags] = useState(null);

    function updateTags() {
        fetch(getAPI() + "/tags", {}).then(res => res.json()).then(data => setTags(data));
    }

    useEffect(() => {
        updateTags()
    }, [])

    function handlePostSubmit(e) {
        e.preventDefault();
    }

    function calculateTags() {
        const ret = []
        tags.forEach((tag, index) => {
            if (postForm.tags.includes(tag.id)) {
                // Why did they make this non-zero-indexed....
                ret.push(index + 1);
            }
        })
        console.log(ret)
        return ret;
    }

    function handleFormChange(e) {
        let value;
        console.log("handleFormChange", e.target.type);
        if (e.target.type === "checkbox") {
            value = e.target.checked;
        } else if (e.target.type === "select-multiple") {
            let selected = [];
            for (let i = 0; i < e.target.length; i++) {
                if (e.target[i].selected) {
                    selected.push(tags[i].id)
                }
            }
            value = selected;
        } else {
            value = e.target.value;
        }

        setPostForm({...postForm, [e.target.name]: value});
    }

    function udateForm(key, value) {
        setPostForm({...postForm, [key]: value});
    }

    if (tags == null) {
        return (
            <div>
                Loading...
            </div>
        )
    }

    return (
        <>
            <div className={"create-post-page"}>
                <form onSubmit={handlePostSubmit}>
                    <div>
                        <label htmlFor={"name"}>title</label>
                        <input name={"title"} id={"name"} value={postForm.title} onChange={handleFormChange}/>
                    </div>
                    <div>
                        <label htmlFor={"post"}>post</label>
                        <textarea name={"post"} value={postForm.post} onChange={handleFormChange}/>
                    </div>
                    <div>
                        <input type={"checkbox"} value="publish" name={"publish"} onChange={handleFormChange}/>
                        <label htmlFor={"publish"}>publish</label>
                    </div>
                    <div>
                        <select name={"tags"} value={calculateTags()} onChange={handleFormChange} multiple={true}>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}
                                        /*selected={postForm.tags.indexOf(tag.id) !== -1}*/>{tag.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button type="submit">Create post</button>
                    </div>

                </form>
            </div>
        </>
    )
}
