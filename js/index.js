const URLParam = new URLSearchParams(window.location.search);
const admin = URLParam.get("admin") || "";
const md = window.markdownit();

function adminChecker() {
  const addButtonPage = document.getElementById("add-post-container");
  isAdmin().then((data) => {
    console.log("data", data);
    if (data) {
      async function uploadPost(title, author, content, file) {
        const formData = new FormData();
        formData.append("admin", admin);
        formData.append("title", title);
        formData.append("author", author);
        formData.append("content", content);
        if (file) formData.append("file", file);

        try {
          const res = await fetch("/api/posts/new", {
            method: "POST",
            body: formData, // 👈 no headers, FormData handles it
          });
          const data = await res.json();
          console.log("data", data);
        } catch (err) {
          console.error("Error adding post:", err);
        }
      }

      async function deletePost(id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          console.error("Error deleting post: invalid id", id);
          return;
        }
        id = parsedId;

        try {
          const res = await fetch(`/api/posts/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, admin }),
          });
          const data = await res.json();
          console.log("data", data);
        } catch (err) {
          console.error("Error deleting post:", err);
        }
      }
      // Adding posts
      addButtonPage.classList.remove("hidden");
      const form = addButtonPage.querySelector("#add-post-form");
      form.onsubmit = (e) => {
        e.preventDefault();
        const author = form.querySelector("#author").value;
        const content = form.querySelector("#content").value;
        const title = form.querySelector("#title").value;
        const file = form.querySelector("#file").files[0];
        uploadPost(title, author, content, file).then(() => getPosts());
      };
      // Deleting posts
      const postsDiv = document.getElementById("posts");
      const posts = postsDiv.querySelectorAll(".post");
      posts.forEach((post) => {
        console.log("Doing post: ", post);
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.onclick = () => {
          const id = post.id.replace("post-", "");
          deletePost(id).then(() => getPosts());
        };
        post.appendChild(deleteButton);
      });
    }
  });
}

function updateAddPostForm() {
  const textarea = document.getElementById("content");
  const preview = document.getElementById("preview");
  const toolbar = document.querySelector(".toolbar");
  const md = window.markdownit();

  // Live preview
  textarea.addEventListener("input", () => {
    preview.innerHTML = md.render(textarea.value);
  });

  // Toolbar actions
  toolbar.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;

    const action = e.target.dataset.action;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.slice(start, end);

    let newText = "";
    switch (action) {
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
    formData.append("admin", admin); // auth check
    formData.append("file", file);

    const res = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
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

  // Paste support
  textarea.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        uploadImage(file);
      }
    }
  });

  // Drag & drop support
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

function getPosts() {
  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = `
        <div class="section-title">Posts</div>
            <div id="add-post-container" class="hidden">
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

                    <input type="file" id="file" name="file" accept="image/*,.pdf,.doc,.docx"><br>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </div>`;
  updateAddPostForm();

  fetch("/api/posts")
    .then((res) => res.json())
    .then((data) => {
      data.reverse();
      data.forEach((post) => {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post");
        postDiv.id = `post-${post.id}`;
        const htmlContent = md.render(post.content);

        // --- Build file preview if present ---
        let filePreview = "";
        if (post.file_key) {
          const fileUrl = `/api/files/${post.file_key}`;
          const lower = post.file_key.toLowerCase();

          if (
            lower.endsWith(".png") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".gif") ||
            lower.endsWith(".webp")
          ) {
            filePreview = `<div class="post-file">
                            <img src="${fileUrl}" alt="Attachment" style="max-height:200px; max-width:100%; object-fit:contain;">
                        </div>`;
          } else {
            filePreview = `<div class="post-file">
                            <a href="${fileUrl}" target="_blank" rel="noopener">📎 Download attachment</a>
                        </div>`;
          }
        }

        postDiv.innerHTML = `
                    <div class="post-title">${post.title}</div>
                    <span class="post-date">
                        ${new Intl.DateTimeFormat("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(post.date_added))}
                    </span>
                    <div class="post-content">${htmlContent}</div>
                    ${filePreview}
                    <span class="post-author">by ${post.author}</span>
                `;

        postsDiv.appendChild(postDiv);
      });
    });

  adminChecker();
}

getPosts();
