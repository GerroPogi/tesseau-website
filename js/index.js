const URLParam = new URLSearchParams(window.location.search);
const admin = URLParam.get("admin") || "";
const md = window.markdownit();
let ISADMIN = false;
// ✅ define the flag here, before listeners
let isUploading = false;

function formatDisplayDate(value) {
  // value is assumed to be "YYYY-MM-DD" or an ISO string
  const d = new Date(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }); // -> "September 20, 2025"
}

function adminChecker() {
  const addButtonPage = document.getElementById("add-post-container");
  isAdmin().then((data) => {
    console.log("admin", data);
    ISADMIN = data;
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
          console.log("added new post: ", data);
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
          console.log("deleting post: ", data);
        } catch (err) {
          console.error("Error deleting post:", err);
        }
      }
      // Adding posts
      addButtonPage.classList.remove("hidden");
      const form = addButtonPage.querySelector("#addPostForm");
      form.onsubmit = (e) => {
        e.preventDefault();

        if (isUploading) {
          alert("Please wait — file is still uploading.");
          return;
        }

        const author = form.querySelector("#author").value;
        const content = form.querySelector("#content").value;
        const title = form.querySelector("#title").value;
        const file = form.querySelector("#fileInput").files[0];

        uploadPost(title, author, content, file).then(() => getPosts());
      };

      // Deleting posts
      const postsDiv = document.getElementById("posts");
      const posts = postsDiv.querySelectorAll(".post");
      posts.forEach((post) => {
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

function updateAddPostForm(admin) {
  const form = document.getElementById("addPostForm");
  const fileInput = form.querySelector("#fileInput");
  const uploadProgress = document.getElementById("uploadProgress");
  const textarea = form.querySelector("#content");

  // fileInput.addEventListener("change", () => {
  //   const file = fileInput.files[0];
  //   if (!file) return;

  //   const formData = new FormData();
  //   formData.append("admin", admin);
  //   formData.append("file", file);

  //   const xhr = new XMLHttpRequest();
  //   xhr.open("POST", "/api/files/upload");

  //   isUploading = true;
  //   uploadProgress.hidden = false;
  //   uploadProgress.value = 0;

  //   xhr.upload.addEventListener("progress", (e) => {
  //     if (e.lengthComputable) {
  //       uploadProgress.value = Math.round((e.loaded / e.total) * 100);
  //     }
  //   });

  //   xhr.onload = () => {
  //     isUploading = false;
  //     uploadProgress.hidden = true;

  //     if (xhr.status === 200) {
  //       const res = JSON.parse(xhr.responseText);
  //       if (res.success) {
  //         const mdLink = `![${file.name}](${res.url})`;
  //         const start = textarea.selectionStart;
  //         textarea.setRangeText(mdLink, start, start, "end");
  //         textarea.dispatchEvent(new Event("input"));
  //       } else {
  //         alert("Upload failed: " + res.message);
  //       }
  //     } else {
  //       alert("Server error: " + xhr.statusText);
  //     }
  //   };

  //   xhr.onerror = () => {
  //     isUploading = false;
  //     uploadProgress.hidden = true;
  //     alert("Network error while uploading.");
  //   };

  //   xhr.send(formData);
  // });
}

const POSTS_PER_PAGE = 5;
let allPosts = [];
let renderedCount = 0;
let showingAll = false;

async function fetchAllPosts() {
  const res = await fetch("/api/posts");
  const data = await res.json();
  return data.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
}

function renderPosts(limit) {
  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";

  const slice = allPosts.slice(0, limit);
  slice.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.classList.add("post");
    postDiv.id = `post-${post.id}`;
    const htmlContent = md.render(post.content);

    let filePreview = "";
    if (post.file_key) {
      const fileUrl = `/api/files/${post.file_key}`;
      const isImg = /\.(png|jpe?g|gif|webp)$/i.test(
        post.file_key.toLowerCase()
      );
      const inner = isImg
        ? `<img src="${fileUrl}" alt="Attachment"
                style="max-height:200px;max-width:100%;object-fit:contain;">`
        : `<a href="${fileUrl}" target="_blank">📎 ${post.file_key.replace(
            /^[\d-]+-/,
            ""
          )}</a>`;
      filePreview = `<div class="post-file editable" data-field="file_key"
                       data-id="${post.id}" data-key="${post.file_key}">
                       ${inner}
                       ${
                         ISADMIN
                           ? `<button class="delete-attach">✕</button>`
                           : ""
                       }
                     </div>`;
    }

    postDiv.innerHTML = `
      <div class="post-title editable" data-field="title" data-id="${post.id}">
        ${post.title}
      </div>
      <span class="post-date editable"
            data-field="date_added"
            data-id="${post.id}"
            data-value="${post.date_added}">
        ${formatDisplayDate(post.date_added)}
      </span>
      <div class="post-content editable"
           data-field="content"
           data-id="${post.id}"
           data-markdown="${encodeURIComponent(post.content)}">
        ${htmlContent}
      </div>
      ${filePreview}
      <span class="post-author editable"
            data-field="author"
            data-id="${post.id}">
        by ${post.author}
      </span>
    `;
    postsDiv.appendChild(postDiv);
  });

  adminChecker();
}

function updateToggleLabel() {
  const btn = document.getElementById("togglePostsBtn");
  if (allPosts.length <= POSTS_PER_PAGE) {
    btn.classList.add("hidden");
  } else {
    btn.classList.remove("hidden");
    btn.textContent = showingAll ? "Show less" : "Load more…";
  }
}

async function getPosts() {
  allPosts = await fetchAllPosts();
  showingAll = false;
  renderedCount = Math.min(POSTS_PER_PAGE, allPosts.length);
  renderPosts(renderedCount);
  updateToggleLabel();
}

document.getElementById("togglePostsBtn").addEventListener("click", () => {
  if (!showingAll) {
    // Show all posts
    showingAll = true;
    renderedCount = allPosts.length;
  } else {
    // Collapse back
    showingAll = false;
    renderedCount = Math.min(POSTS_PER_PAGE, allPosts.length);

    // Smooth scroll back to the top of the posts section
    const postsTop = document.getElementById("posts").offsetTop;
    window.scrollTo({ top: postsTop - 20, behavior: "smooth" });
  }

  renderPosts(renderedCount);
  updateToggleLabel();
});

// Initial load
getPosts();

document.addEventListener("click", (e) => {
  if (!ISADMIN) return;
  const el = e.target.closest(".editable");
  if (!el) return;

  const field = el.dataset.field;
  const id = el.dataset.id;

  // --- ATTACHMENT editing ---
  if (field === "file_key") {
    const wrapper = document.createElement("div");
    wrapper.className = "attach-editor";
    wrapper.innerHTML = `
    <input type="file" class="file-replace">
    <progress max="100" value="0" hidden></progress>
    <div class="actions">
      <button class="save-btn">Upload & Save</button>
      <button class="clear-btn">Clear</button>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;
    el.replaceWith(wrapper);

    const input = wrapper.querySelector(".file-replace");
    const prog = wrapper.querySelector("progress");

    const save = async () => {
      const file = input.files[0];

      // ---- Case 1: user cleared the attachment ----
      if (!file) {
        await fetch("/api/posts/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin, id, file_key: "" }),
        });
        getPosts();
        return;
      }

      // ---- Case 2: upload a new file, then update the DB ----
      const form = new FormData();
      form.append("admin", admin);
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload");

      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) {
          prog.hidden = false;
          prog.value = Math.round((ev.loaded / ev.total) * 100);
        }
      });

      xhr.onload = async () => {
        prog.hidden = true;

        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);

          if (res.success && res.fileKey) {
            // ✅ use fileKey
            await fetch("/api/posts/edit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                admin,
                id,
                file_key: res.fileKey, // ✅ send fileKey to DB
              }),
            });
            getPosts();
          } else {
            alert("Upload failed");
            console.log("Upload response:", res);
          }
        } else {
          alert("Server error");
        }
      };

      xhr.onerror = () => {
        prog.hidden = true;
        alert("Network error while uploading.");
      };

      xhr.send(form);
    };

    wrapper.querySelector(".save-btn").addEventListener("click", save);

    wrapper.querySelector(".clear-btn").addEventListener("click", async () => {
      await fetch("/api/posts/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin, id, file_key: "" }),
      });
      getPosts();
    });

    wrapper
      .querySelector(".cancel-btn")
      .addEventListener("click", () => wrapper.replaceWith(el));

    return;
  }

  // --- DATE editing ---
  if (field === "date_added") {
    const orig = el.dataset.value || new Date().toISOString().slice(0, 10);
    const input = document.createElement("input");
    input.type = "date";
    input.value = orig.slice(0, 10);
    el.replaceWith(input);
    input.focus();

    const saveDate = async () => {
      const val = input.value.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        alert("Date must be in YYYY-MM-DD format");
        return;
      }
      if (val !== orig) {
        await fetch("/api/posts/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin, id, date_added: val }),
        });
      }
      el.textContent = formatDisplayDate(val);
      el.dataset.value = val;
      input.replaceWith(el);
    };

    input.addEventListener("blur", saveDate);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        saveDate();
      }
      if (ev.key === "Escape") input.replaceWith(el);
    });
    return;
  }

  // --- CONTENT editing (markdown editor) ---
  if (field === "content") {
    const originalMD = decodeURIComponent(el.dataset.markdown || "");

    const wrapper = document.createElement("div");
    wrapper.className = "inline-md-editor";
    wrapper.innerHTML = `
      <div class="toolbar">
        <button type="button" data-action="bold"><b>B</b></button>
        <button type="button" data-action="italic"><i>I</i></button>
        <button type="button" data-action="header">H</button>
        <button type="button" data-action="link">🔗</button>
        <button type="button" data-action="list">• List</button>
      </div>
      <textarea class="editor-textarea">${originalMD}</textarea>
      <div class="preview">${md.render(originalMD)}</div>
      <div class="editor-actions">
        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;

    el.replaceWith(wrapper);

    const textarea = wrapper.querySelector(".editor-textarea");
    const preview = wrapper.querySelector(".preview");
    const toolbar = wrapper.querySelector(".toolbar");

    textarea.addEventListener("input", () => {
      preview.innerHTML = md.render(textarea.value);
    });

    toolbar.addEventListener("click", (ev) => {
      if (ev.target.tagName !== "BUTTON") return;
      const act = ev.target.dataset.action;
      const { selectionStart: s, selectionEnd: e, value } = textarea;
      const sel = value.slice(s, e);
      let snippet = "";

      switch (act) {
        case "bold":
          snippet = `**${sel || "bold text"}**`;
          break;
        case "italic":
          snippet = `*${sel || "italic text"}*`;
          break;
        case "header":
          snippet = `# ${sel || "Heading"}`;
          break;
        case "link":
          snippet = `[${sel || "link text"}](http://)`;
          break;
        case "list":
          snippet = `- ${sel || "list item"}`;
          break;
      }
      textarea.setRangeText(snippet, s, e, "end");
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });

    wrapper.querySelector(".save-btn").addEventListener("click", async () => {
      const newVal = textarea.value.trim();
      if (newVal !== originalMD) {
        await fetch("/api/posts/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin, id, content: newVal }),
        });
      }
      el.innerHTML = md.render(newVal);
      el.dataset.markdown = encodeURIComponent(newVal);
      wrapper.replaceWith(el);
    });

    wrapper.querySelector(".cancel-btn").addEventListener("click", () => {
      wrapper.replaceWith(el);
    });

    return;
  }

  // --- TITLE / AUTHOR inline editing ---
  let originalText =
    field === "author" ? el.textContent.replace(/^by\s+/, "") : el.textContent;

  const input = document.createElement("input");
  input.value = originalText;
  input.className = "inline-editor";
  el.replaceWith(input);
  input.focus();

  const saveInline = async () => {
    const newVal = input.value.trim();
    let displayVal = newVal;
    if (field === "author") displayVal = `by ${newVal}`;
    if (newVal !== originalText) {
      await fetch("/api/posts/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin, id, [field]: newVal }),
      });
    }
    el.textContent = displayVal;
    input.replaceWith(el);
  };

  const cancelInline = () => input.replaceWith(el);

  input.addEventListener("blur", saveInline);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      saveInline();
    }
    if (ev.key === "Escape") cancelInline();
  });
});
