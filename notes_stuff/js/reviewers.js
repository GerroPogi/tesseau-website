// === FETCH REVIEWERS ===
function renderReviewers(list) {
    const reviewers = document.getElementById("reviewers");
    reviewers.innerHTML = "";
    list.forEach(reviewer => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="./reviewer.html?id=${reviewer.id}">${reviewer.title}</a>
                    <div><small>By ${reviewer.creator} • ${reviewer.subject} • ${reviewer.date_added ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(reviewer.date_added)) : ""}</small></div>`;
    reviewers.appendChild(li);
    });
}

fetch("/api/reviewers")
    .then(response => response.json())
    .then(data => {
    allReviewers = data;
    renderReviewers(allReviewers);
    });

// === FILTERS & SEARCH ===
function applyFilters() {
    const search = document.getElementById("search").value.toLowerCase();
    const creator = document.getElementById("filterCreator").value.toLowerCase();
    const subject = document.getElementById("filterSubject").value;
    const date = document.getElementById("filterDate").value;

    const filtered = allReviewers.filter(r => {
    const matchesSearch = r.title.toLowerCase().startsWith(search);
    const matchesCreator = creator ? r.creator.toLowerCase().includes(creator) : true;
    const matchesSubject = subject ? r.subject === subject : true;
    const matchesDate = date ? r.date_added && r.date_added.startsWith(date) : true;
    return matchesSearch && matchesCreator && matchesSubject && matchesDate;
    });

    renderReviewers(filtered);
}

document.getElementById("search").addEventListener("input", applyFilters);
document.getElementById("filterCreator").addEventListener("input", applyFilters);
document.getElementById("filterSubject").addEventListener("change", applyFilters);
document.getElementById("filterDate").addEventListener("change", applyFilters);