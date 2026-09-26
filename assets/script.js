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

/* Motion (v2 polish): fade-up on entry, the month timeline line fills as you scroll, the real
   posts drift at slightly different depths, and $78K counts up once. Transform/opacity only,
   one rAF-throttled scroll handler, nothing at all for prefers-reduced-motion. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  root.classList.add("js-motion");

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // 1. reveal once on entry
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  document.querySelectorAll("[data-in]").forEach(function (el) { io.observe(el); });

  // 2. count up the real number once, when half of it is on screen
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.disconnect();
        var start = null, dur = 1400;
        function tick(t) {
          if (start === null) start = t;
          var k = clamp((t - start) / dur, 0, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = String(Math.round(target * eased));
          if (k < 1) requestAnimationFrame(tick);
        }
        el.textContent = "0";
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    co.observe(el);
  });

  // 3. scroll-linked: timeline line + post depth
  var timeline = document.getElementById("timeline");
  var posts = document.querySelectorAll(".post");
  var rates = [-26, 34, -8];
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (vh * 0.5), 0, 1);
      timeline.style.setProperty("--line-p", p.toFixed(3));
    }
    for (var i = 0; i < posts.length; i++) {
      var pr = posts[i].getBoundingClientRect();
      if (pr.bottom < -100 || pr.top > vh + 100) continue;
      var c = clamp(((pr.top + pr.height / 2) - vh / 2) / vh, -1, 1);
      posts[i].style.transform = "translate3d(0," + (c * rates[i % rates.length]).toFixed(1) + "px,0)";
    }
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (timeline) timeline.style.setProperty("--line-p", "0");
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  update();
})();
