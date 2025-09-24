// navbar.js
console.debug("navbar.js loading...");

function applyParamsToNavLinks() {
  const params = window.location.search;
  if (!params) return;

  const currentParams = new URLSearchParams(params);

  document.querySelectorAll(".nav-link, .navbar a").forEach((link) => {
    const url = new URL(link.href, window.location.origin);

    if (currentParams.has("admin")) {
      url.searchParams.set("admin", currentParams.get("admin"));
    }

    link.href = url.href;
  });
}

applyParamsToNavLinks();
console.log("navbar.js loaded");

// -------- Toast System --------
function showToast(message, type = "default") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast");

  // type-based colors
  if (type === "success") toast.style.backgroundColor = "#28a745";
  if (type === "error") toast.style.backgroundColor = "#dc3545";
  if (type === "warning") toast.style.backgroundColor = "#ffc107";
  if (type === "info") toast.style.backgroundColor = "#17a2b8";

  toast.innerText = message;
  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
