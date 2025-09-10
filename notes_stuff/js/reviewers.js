const urlParams = new URLSearchParams(window.location.search);
const REVIEWERS_PER_PAGE = 10;
let current_page= 0;
let max_page;

console.log("Reviewers loading")

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
    applyFilters();
    max_page = Math.ceil(allReviewers.length / REVIEWERS_PER_PAGE);
    });

const subjectDict = {
    "": "",
    "itp": "Intro to Philosophy",
    "ess": "Earth and Space Science 1",
    "fm": "Finite Math 1",
    "e": "English",
    "f": "Filipino",
    "gm": "General Math",
    "gs": "General Science",
    "lcs": "Life and Career Skills",
    "k": "Pag-aaral ng Kasaysayan at Lipunang Pilipino",
};

// === FILTERS & SEARCH ===
function applyFilters() {
    current_page = parseInt(urlParams.get("page") || 1, 10);
    const search = document.getElementById("search").value.toLowerCase() ;
    
    const creator = document.getElementById("filterCreator").value.toLowerCase();
    const subject = subjectDict[document.getElementById("filterSubject").value || urlParams.get("subject")];
    const date = document.getElementById("filterDate").value;
    const sort = document.getElementById("filterSort").value;
    console.log(subject)

    let filtered = allReviewers;
    if(sort =="newestFirst") filtered.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
    if(sort =="oldestFirst") filtered.sort((a, b) => new Date(a.date_added) - new Date(b.date_added));
    if(sort =="relevance") {
        filtered.sort((a, b) => b.rating - a.rating);
    }
    filtered = allReviewers.filter(r => {
    const matchesSearch = r.title.toLowerCase().startsWith(search);
    const matchesCreator = creator ? r.creator.toLowerCase().includes(creator) : true;
    const matchesSubject = subject ? r.subject === subject : true;
    const matchesDate = date ? r.date_added && r.date_added.startsWith(date) : true;
    return matchesSearch && matchesCreator && matchesSubject && matchesDate;
    }).splice((current_page - 1) * REVIEWERS_PER_PAGE, REVIEWERS_PER_PAGE*current_page);
    console.log(filtered)
    

    renderReviewers(filtered);
    setupPagination();

}
let newPage;
function changePage(increment) {
    newPage = current_page + increment;
    if (newPage < 1 || newPage > max_page) newPage = current_page;
    current_page = newPage;
    document.getElementById("currentPage").innerText = current_page;
    urlParams.set("page", current_page);
    history.replaceState(null, "", "?" + urlParams.toString());
    applyFilters();
}

function setupPagination() {
    if (max_page <= 1) {
        document.querySelector(".pagination").classList.add("hidden");
        return;
    }
    if (current_page >= max_page) {
        current_page = max_page;
        document.getElementById("nextPage").disabled = true;
    } else {
        document.getElementById("nextPage").disabled = false;
    }
    if (current_page <= 1 ) {
        current_page = 1;
        document.getElementById("prevPage").disabled = true;
    } else {
        document.getElementById("prevPage").disabled = false;
    }
    document.getElementById("prevPage").addEventListener("click", () => changePage(-1));
    document.getElementById("nextPage").addEventListener("click", () => changePage(1));
    document.getElementById("currentPage").innerText = current_page;
}


document.getElementById("search").addEventListener("input", applyFilters);
document.getElementById("filterCreator").addEventListener("input", applyFilters);
document.getElementById("filterSubject").addEventListener("change", applyFilters);
document.getElementById("filterDate").addEventListener("change", applyFilters);
document.getElementById("filterSort").addEventListener("change", applyFilters);