const textarea = document.getElementById("content");
const preview = document.getElementById("preview");
const toolbar = document.querySelector(".toolbar");

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
