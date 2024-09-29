import {useContext, useEffect, useState} from "react";
import {getAPI} from "../util.js";
import {AuthContext} from "../contexts/AuthorisationContext.js";

export default function CreatePostPage() {
    const [postForm, setPostForm] = useState({title: "", publish: false, post: "", tags: [], rawTags: ""});
    const [tags, setTags] = useState(null);
    const auth = useContext(AuthContext);

    function updateTags() {
        fetch(getAPI() + "/tags", {}).then(res => res.json()).then(data => setTags(data));
    }

    useEffect(() => {
        updateTags()
    }, [])

    function handlePostSubmit(e) {
        e.preventDefault();
        const headers = {}
        if (auth) {
            headers["Authorization"] = `Bearer ${auth.token}`;
        }
        fetch(getAPI() + "/posts", {
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(postForm)
        }).then(res => {
            if (res.status === 200) {
                res.json().then((post) => {
                    console.log(post);
                })
            } else {
                res.json().then((error) => {
                    console.log(res.status, error.error)
                })
            }
        })
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

function getSelectedTags() {
    const ret = [];
    tags.forEach((tag, index) => {
        if (postForm.tags.includes(tag.id)) {
            ret.push(tag);
        }
    })
    return ret;
}

function getUnusedTags() {
    const ret = [];
    tags.forEach((tag) => {
        if (!postForm.tags.includes(tag.id)) {
            ret.push(tag);
        }
    })
    return ret;
}

function removeTag(removal) {
    const ret = [];
    tags.forEach((tag) => {
        if (tag !== removal) {
            ret.push(tag.id);
        }
    })
    setPostForm({...postForm, tags: ret});
}

function addTag(newTag) {
    const ret = [...postForm.tags];
    ret.push(newTag.id);
    setPostForm({...postForm, tags: ret});
}

if (tags == null) {
    return (
        <div>
            Loading...
        </div>
    )
}

console.log("selected", postForm.tags)
console.log("tagsUnused", getUnusedTags())
console.log("tagsUsed", getSelectedTags())

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
                    <div className={"tags-holder"} style={{backgroundColor: "red"}}>
                        {getSelectedTags().map(tag => (
                            <span key={tag.id} onClick={() => {
                                removeTag(tag)
                            }}>{tag.name}</span>
                        ))}
                    </div>

                    <div className={"tags-holder"} style={{backgroundColor: "green"}}>
                        {getUnusedTags().map(tag => (
                            <span key={tag.id} onClick={() => {
                                addTag(tag)
                            }}>{tag.name}</span>
                        ))}
                    </div>

                    <input name={"rawTags"} value={postForm.rawTags} onChange={handleFormChange} onKeyDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('fuuuu')
                    }}/>
                </div>
                <div>
                    <button type="submit">Create post</button>
                </div>

            </form>
        </div>
    </>
)
}
