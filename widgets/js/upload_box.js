// use the same "admin" already available in your page
const fileInput = document.getElementById("fileInput");
const progressBar = document.getElementById("progressBar");
const statusEl = document.getElementById("status");
const textarea = document.getElementById("content"); // markdown editor

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("admin", admin);
  formData.append("file", file);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/files/upload", true);

  // Progress
  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.hidden = false;
      progressBar.value = percent;
      statusEl.textContent = `Uploading: ${percent}%`;
    }
  });

  xhr.onload = () => {
    progressBar.hidden = true;
    progressBar.value = 0;

    if (xhr.status === 200) {
      const res = JSON.parse(xhr.responseText);
      statusEl.innerHTML = `<span style="color:green">Uploaded!</span>`;

      // Insert markdown link into textarea
      let mdLink;
      const lower = file.name.toLowerCase();
      if (/\.(png|jpe?g|gif|webp)$/i.test(lower)) {
        mdLink = `![${file.name}](${res.url})`;
      } else {
        mdLink = `[${file.name}](${res.url})`;
      }

      const start = textarea.selectionStart;
      textarea.setRangeText(mdLink, start, start, "end");
      textarea.dispatchEvent(new Event("input"));
      fileInput.value = "";
    } else {
      statusEl.innerHTML = `<span style="color:red">Upload failed: ${xhr.responseText}</span>`;
    }
  };

  xhr.onerror = () => {
    progressBar.hidden = true;
    statusEl.textContent = "Network error.";
  };

  statusEl.textContent = "Starting upload...";
  xhr.send(formData);
});
