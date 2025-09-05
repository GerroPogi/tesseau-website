const params = new URLSearchParams(window.location.search);
const id = params.get('id');

fetch(`/api/reviewers/${id}`)
    .then(response => response.json())
    .then(data => {
    document.getElementById("title").textContent = data.title;
    document.getElementById("creator").textContent = "Creator: " + data.creator;

    const sidebar = document.getElementById("sidebar");
    const viewerContainer = document.getElementById("viewer-container");
    const aboutDiv = document.getElementById("about");
    const commentsDiv = document.getElementById("comments");

    let reviewers = [];
    try {
        reviewers = JSON.parse(data.reviewer);
    } catch (e) {
        reviewers = [{ id: null, name: data.reviewer }];
    }

    reviewers.forEach((r, index) => {
        const tab = document.createElement("div");
        tab.classList.add("tab");
        if (index === 0) tab.classList.add("active");
        tab.innerText = r.name;
        sidebar.appendChild(tab);

        tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        viewerContainer.innerHTML = `
            <iframe 
            class="viewer"
            src="https://drive.google.com/file/d/${r.id}/preview"
            allow="autoplay"
            ></iframe>
        `;

        aboutDiv.classList.add("hidden");
        commentsDiv.classList.add("hidden");
        viewerContainer.classList.remove("hidden");
        });

        if (index === 0 && r.id) {
        viewerContainer.innerHTML = `
            <iframe 
            class="viewer"
            src="https://drive.google.com/file/d/${r.id}/preview"
            allow="autoplay"
            ></iframe>
        `;
        }
    });

    // About tab
    const aboutTab = document.createElement("div");
    aboutTab.classList.add("tab");
    aboutTab.innerText = "About";
    sidebar.appendChild(aboutTab);

    aboutTab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        aboutTab.classList.add("active");
        viewerContainer.classList.add("hidden");
        aboutDiv.innerHTML = `
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Description:</strong> ${data.description}</p>
        <p><strong>Date:</strong> ${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(data.date_added))}</p>
        `;
        aboutDiv.classList.remove("hidden");
        commentsDiv.classList.add("hidden");
    });

    // Comments tab
    const commentsTab = document.createElement("div");
    commentsTab.classList.add("tab");
    commentsTab.innerText = "Comments";
    sidebar.appendChild(commentsTab);

    commentsTab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        commentsTab.classList.add("active");
        aboutDiv.classList.add("hidden");
        viewerContainer.classList.add("hidden");
        commentsDiv.classList.remove("hidden");
    });

    // Comment form handling
    const form = document.getElementById("commentForm");
    const commentList = document.getElementById("commentList");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const author = document.getElementById("commentAuthor").value.trim() || "Anonymous";
        const commentText = document.getElementById("commentText").value.trim();
        if (!commentText) return;

        const newComment = {
        author,
        content: commentText,
        likes: 0,
        date_added: new Date().toISOString(),
        reviewer_id: id
        };

        fetch("/api/comments/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment)
        })
        .then(res => res.json())
        .then(saved => {
        console.log("Comment saved:", saved);
        addCommentToList(saved);
        form.reset();
        })
        .catch(err => console.error("Error saving comment:", err));
    });

    function addCommentToList(comment) {
        const div = document.createElement("div");
        div.classList.add("comment-item");
        div.dataset.commentId = comment.id;
        div.innerHTML = `
        <p>${comment.content}</p>
        <div class="comment-meta">— ${comment.author}, ${new Date(comment.date_added).toLocaleString()}</div>
        <span class="reply-link">Reply</span>
        <span class="toggle-replies">Show replies</span>
        <div class="reply-list hidden"></div>
        `;
        
        const replyList = div.querySelector(".reply-list");
        const toggleReplies = div.querySelector(".toggle-replies");

        // Toggle replies
        toggleReplies.addEventListener("click", () => {
        if (replyList.classList.contains("hidden")) {
            if (!replyList.dataset.loaded) {
            fetch(`/api/replies/${comment.id}`)
                .then(res => res.json())
                .then(replies => {
                replies.results.forEach(reply => {
                    addReplyToList(reply, replyList);
                });
                replyList.dataset.loaded = "true";
                });
            }
            replyList.classList.remove("hidden");
            toggleReplies.textContent = "Hide replies";
        } else {
            replyList.classList.add("hidden");
            toggleReplies.textContent = "Show replies";
        }
        });

        // Reply form toggle
        const replyLink = div.querySelector(".reply-link");
        replyLink.addEventListener("click", () => {
        let replyForm = div.querySelector(".reply-form");
        if (replyForm) {
            replyForm.remove();
        } else {
            replyForm = document.createElement("form");
            replyForm.classList.add("reply-form");
            replyForm.innerHTML = `
            <input type="text" placeholder="Your name (or anonymous)" class="reply-author"/>
            <textarea placeholder="Write a reply..." class="reply-text"></textarea>
            <button type="submit">Reply</button>
            `;
            div.appendChild(replyForm);

            replyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const author = replyForm.querySelector(".reply-author").value.trim() || "Anonymous";
            const content = replyForm.querySelector(".reply-text").value.trim();
            if (!content) return;

            const newReply = {
                author,
                content,
                likes: 0,
                date_added: new Date().toISOString(),
                comment_id: comment.id || 0
            };

            fetch("/api/replies/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newReply)
            })
            .then(res => res.json())
            .then(saved => {
                addReplyToList(saved, replyList);
                replyList.classList.remove("hidden");
                toggleReplies.textContent = "Hide replies";
                replyForm.reset();
            })
            .catch(err => console.error("Error saving reply:", err));
            });
        }
        });

        commentList.prepend(div);
    }


    function addReplyToList(reply, replyList) {
        const replyDiv = document.createElement("div");
        replyDiv.classList.add("reply-item");
        replyDiv.innerHTML = `
        <p>${reply.content}</p>
        <div class="reply-meta">— ${reply.author}, ${new Date(reply.date_added).toLocaleString()}</div>
        `;
        replyList.appendChild(replyDiv);
    }


    // Load initial comments
    fetch(`/api/comments/${id}`)
        .then(response => response.json())
        .then(data => {
        data.results.forEach(comment => {
            addCommentToList(comment);
        });
        });
    })
    .catch(error => {
    console.error('Error fetching reviewer data:', error);
    });