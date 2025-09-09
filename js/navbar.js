// navbar.js
console.debug("navbar.js loading...");

function applyParamsToNavLinks() {
  const params = window.location.search;
  console.log("params", params);
  if (!params) return;

  const currentParams = new URLSearchParams(params);

  document.querySelectorAll(".nav-link, .navbar a").forEach(link => {
    const url = new URL(link.href, window.location.origin);

    if ("admin" in currentParams){
      url.searchParams.set("admin", currentParams["admin"]);
    }

    link.href = url.pathname + "?" + url.searchParams.toString();
  });
}

applyParamsToNavLinks(); // run immediately
console.log("navbar.js loaded");
