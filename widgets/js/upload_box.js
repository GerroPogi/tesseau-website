// /js/upload_box.js
console.log("Running upload_box.js");
const input = document.getElementById("fileInput");
console.log("Found input", input);
const progressBar = document.getElementById("uploadProgress");
console.log("Found progress bar", progressBar);
const status = document.getElementById("uploadStatus");
console.log("Found status", status);

if (!input || !progressBar || !status) {
  console.error("Upload elements missing");
}

// Allow multiple if data-multiple="true"
if (input.dataset.multiple === "true") {
  input.setAttribute("multiple", "multiple");
} else {
  input.removeAttribute("multiple");
}

input.addEventListener("change", async () => {
  if (!input.files.length) return;

  const files = Array.from(input.files);
  status.textContent = `Uploading ${files.length} file${
    files.length > 1 ? "s" : ""
  }...`;

  for (const [index, file] of files.entries()) {
    try {
      const key = await uploadFile(file, index + 1, files.length);
      // hand the key off to index.js if you need to save it
      window.dispatchEvent(
        new CustomEvent("file-uploaded", { detail: { key } })
      );
    } catch (e) {
      console.error(e);
    }
  }
  // Hide when everything is done
  progressBar.hidden = true;
});

function uploadFile(file, current, total) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("admin", admin || "");
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files/upload");

    // show & reset progress bar
    progressBar.hidden = false;
    progressBar.value = 0;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressBar.value = percent;
        status.textContent = `Uploading ${current}/${total}: ${Math.round(
          percent
        )}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        status.textContent = `Uploaded ${file.name} (${current}/${total})`;
        resolve(res.fileKey); // return the key
      } else {
        status.textContent = `Error uploading ${file.name}`;
        reject(new Error(xhr.statusText));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
