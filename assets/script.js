(function () {
  "use strict";

  var root = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");
  var menuToggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");

  // ---- Theme toggle (persists per-visitor only, via localStorage) ----
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentTheme() {
    var stored = null;
    try { stored = localStorage.getItem("dm-theme"); } catch (e) { /* private mode etc */ }
    try { var q = new URLSearchParams(location.search).get("theme"); if (q === "light" || q === "dark") return q; } catch (e) { /* old browsers */ }
    if (stored === "light" || stored === "dark") return stored;
    return systemPrefersDark() ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      var isDark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("dm-theme", next); } catch (e) { /* ignore */ }
    });
  }

  // ---- Mobile nav ----
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }
})();
