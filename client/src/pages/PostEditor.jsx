import {useContext, useEffect, useState} from "react";
import {getAPI} from "../util.js";
import {AuthContext} from "../contexts/AuthorisationContext.js";
import {useNavigate} from "react-router-dom";

export default function PostEditor() {
    const [postForm, setPostForm] = useState({
        title: "",
        publish: false,
        post: "",
        tags: [],
        rawTags: "",
        extraTags: []
    });
    const [tags, setTags] = useState(null);
    const auth = useContext(AuthContext);
    const navigation = useNavigate();

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
                    navigation(`/post/${post.id}`)
                    console.log(post);

                })
            } else {
                res.json().then((error) => {
                    alert(error.error)
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
        let ret = [];
        if (postForm.tags.includes(removal.id)) {
            console.log("in", postForm.tags);
            ret = postForm.tags.filter(tag => tag !== removal.id);
            console.log("out", ret);
        }

        setPostForm({...postForm, tags: ret});
    }

    function addTag(newTag) {
        const ret = [...postForm.tags];
        ret.push(newTag.id);
        setPostForm({...postForm, tags: ret});
    }

    function addRawTag(newTag) {
        const newExtras = [...postForm.extraTags];
        if (!newExtras.includes(newTag)) {
            newExtras.push(newTag);
        } else {
            return
        }

        setPostForm({...postForm, rawTags: "", extraTags: newExtras});
    }

    function removeExtraTag(removal) {
        const ret = [];
        postForm.extraTags.forEach((tag) => {
            if (tag !== removal) {
                ret.push(tag);
            }
        })

        setPostForm({...postForm, extraTags: ret})
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
                    <div className={"form-group"}>
                        <div className={"form-group-label"}>
                            <label htmlFor={"name"}>title</label>
                        </div>
                        <input name={"title"} id={"name"} value={postForm.title} onChange={handleFormChange}/>
                    </div>
                    <div className={"form-group"}>
                        <div className={"form-group-label"}>
                            <label htmlFor={"post"}>post</label>
                        </div>
                        <textarea cols={80} name={"post"} value={postForm.post} onChange={handleFormChange}/>
                    </div>
                    <div className={"form-group"}>
                        <div className={"form-group-label"}>
                            <input type={"checkbox"} value="publish" name={"publish"} onChange={handleFormChange}/>
                        </div>
                        <label htmlFor={"publish"}>publish</label>
                    </div>
                    <div className={"form-group"}>
                        <div className={"tags-holder"}>
                            {getSelectedTags().map(tag => (
                                <span className={"added-tag"} key={tag.id} onClick={() => {
                                    removeTag(tag)
                                }}>❌{tag.name}</span>
                            ))}
                            {postForm.extraTags ? (postForm.extraTags.map((tag) => (
                                <span className={"added-tag"} key={tag} onClick={() => {
                                    removeExtraTag(tag)
                                }}>❌{tag}</span>
                            ))) : <></>}
                        </div>
                        <div className={"tags-holder"}>
                            <div className={"tags-holder"}>
                                {getUnusedTags().map(tag => (
                                    <span className={"unadded-tag"} key={tag.id} onClick={() => {
                                        addTag(tag)
                                    }}>➕{tag.name}</span>
                                ))}

                            </div>

                            <input name={"rawTags"} value={postForm.rawTags} onChange={handleFormChange}
                                   onKeyDown={(e) => {
                                       if (e.key !== "Enter") return
                                       e.preventDefault();
                                       e.stopPropagation();
                                       addRawTag(e.target.value)
                                   }}/>
                        </div>
                    </div>
                    <div>
                        <button type="submit">Create post</button>
                    </div>

                </form>
            </div>
        </>
    )
}
