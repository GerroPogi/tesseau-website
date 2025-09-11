const URLParam = new URLSearchParams(window.location.search);
const admin = URLParam.get("admin") || "";
const md = window.markdownit();

function adminChecker() {
    const addButtonPage = document.getElementById("add-post-container");
    isAdmin().then(data => {
        console.log("data", data);
        if (data){
            function uploadPost(title, author, content, files){
                fetch("/api/posts/new", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({title, author, content, files, admin})
                })
                .then(res => res.json())
                .then(data => {
                    console.log("data", data);
                })
                .catch(err => console.error("Error adding post:", err));
                
            }
            addButtonPage.classList.remove("hidden");
            const form = addButtonPage.querySelector("#add-post-form");
            form.onsubmit = (e) => {
                e.preventDefault();
                const author = form.querySelector("#author").value;
                const content = form.querySelector("#content").value;
                const title = form.querySelector("#title").value;
                const file = form.querySelector("#file").files[0];
                uploadPost(title, author, content, file);
                getPosts();
            }
        }
    });
}

function updateAddPostForm(){
    const textarea = document.getElementById("content");
    const preview = document.getElementById("preview");
    const toolbar = document.querySelector(".toolbar");
    const md = window.markdownit();

    // Live preview
    textarea.addEventListener("input", () => {
    preview.innerHTML = md.render(textarea.value);
    });

    // Toolbar actions (same as before)
    toolbar.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;

    const action = e.target.dataset.action;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);

    let newText = "";
    switch(action) {
        case "bold":
        newText = `**${selectedText || "bold text"}**`;
        break;
        case "italic":
        newText = `*${selectedText || "italic text"}*`;
        break;
        case "header":
        newText = `# ${selectedText || "Heading"}`;
        break;
        case "link":
        newText = `[${selectedText || "link text"}](http://)`;
        break;
        case "list":
        newText = `- ${selectedText || "list item"}`;
        break;
    }

    textarea.setRangeText(newText, start, end, "end");
    textarea.dispatchEvent(new Event("input"));
    });

    // Upload image and insert markdown link
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/posts/upload", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            const markdown = `![${file.name}](${data.url})`;
            const start = textarea.selectionStart;
            textarea.setRangeText(markdown, start, start, "end");
            textarea.dispatchEvent(new Event("input"));
        } else {
            alert("Image upload failed");
        }
    }

    // Handle paste
    textarea.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            uploadImage(file);
        }
    }
    });

    // Handle drag & drop
    textarea.addEventListener("dragover", (e) => e.preventDefault());
    textarea.addEventListener("drop", (e) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
        if (file.type.startsWith("image/")) {
        uploadImage(file);
        }
    }
    });

}


function getPosts(){
    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = `
        <div class="section-title">Posts</div>
            <div id = "add-post-container" class = "hidden">
                <h2>Add Post</h2>
                <form id="add-post-form">
                    <input type="text" id="author" name="author" placeholder="Author"><br>
                    <input type="text" id="title" name="title" placeholder="Title"><br>
                    <div id="editor">
                        <div class="toolbar">
                            <button type="button" data-action="bold"><b>B</b></button>
                            <button type="button" data-action="italic"><i>I</i></button>
                            <button type="button" data-action="header">H</button>
                            <button type="button" data-action="link">🔗</button>
                            <button type="button" data-action="list">• List</button>
                        </div>
                        <textarea id="content" placeholder="Write your post in markdown..."></textarea>
                        <div id="preview" class="preview"></div>
                    </div>

                    <input type="file" id="file" name="file" accept="image/*"><br>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>`;
    updateAddPostForm();
    fetch("/api/posts").then(data => data.json())
        .then(data => {
            data.reverse();
            
            data.forEach(post => {
                const postDiv = document.createElement("div");
                postDiv.classList.add("post");
                const content= md.render(post.content);
                postDiv.innerHTML = `
                    <div class="post-title">${post.title}</div>
                    <span class="post-date">${new Intl.DateTimeFormat('en-US', {month: 'long', day: 'numeric', year: 'numeric'}).format(new Date(post.date_added))}</span>
                    <div class="post-content">${content}</div>
                    <span class="post-author">by ${post.author}</span>
                `;
                postsDiv.appendChild(postDiv);
            });
        }
    );
    adminChecker();
}

getPosts();


