const md = window.markdownit();

const form = document.getElementById("suggestions-form");
form.onsubmit = (e) => {
  e.preventDefault();
  fetch("/api/forms/suggestions/new", {
    body: JSON.stringify({
      author: document.getElementById("name").value,
      content: document.getElementById("content").value,
      email: document.getElementById("email").value,
    }),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((data) => data.json())
    .then((data) => {
      showToast("Suggestion sent!");
    })
    .catch((err) => {
      showToast("Error sending suggestion: " + err + " error", "error");
    });
};

function buildSuggestionElement(suggestion) {
  const el = document.createElement("div");
  el.classList.add("suggestion");

  const suggestion_content = document.createElement("div");
  suggestion_content.classList.add("suggestion-content");
  suggestion_content.innerHTML = md.render(suggestion.content);
  el.appendChild(suggestion_content);

  const dateEl = document.createElement("p");
  dateEl.classList.add("suggestion-date");
  const date_added = new Date(suggestion.date_added);
  const diffTime = Math.abs(new Date() - date_added);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffSeconds = Math.ceil(diffTime / 1000);

  let timeString;
  if (diffDays > 0) {
    timeString = `${diffDays} days ago`;
  } else if (diffHours > 0) {
    timeString = `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    timeString = `${diffMinutes} minutes ago`;
  } else {
    timeString = `${diffSeconds} seconds ago`;
  }

  dateEl.textContent = timeString;
  el.appendChild(dateEl);

  return el;
}

fetch("/api/forms/suggestions")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("responses-container");
    data.forEach((suggestion) => {
      container.appendChild(buildSuggestionElement(suggestion));
    });
  });
