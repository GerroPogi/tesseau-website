document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("fileInput");
  const progressBar = document.getElementById("uploadProgress");
  const status = document.getElementById("uploadStatus");

  // Toggle multiple attribute based on data-multiple
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
    progressBar.value = 0;

    for (const [index, file] of files.entries()) {
      await uploadFile(file, index + 1, files.length);
    }
  });

  async function uploadFile(file, current, total) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("admin", window.ADMIN_TOKEN || "");
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files/upload");

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
          status.textContent = `Uploaded ${file.name} (${current}/${total})`;
          resolve();
        } else {
          status.textContent = `Error uploading ${file.name}`;
          reject();
        }
      };

      xhr.onerror = reject;
      xhr.send(formData);
    });
  }
});
