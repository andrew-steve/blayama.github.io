/* Portfolio interactions: theme, copy buttons, project filters, microscope field */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- theme toggle ---------- */
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function paintToggle() {
    var dark = currentTheme() === "dark";
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      b.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
    });
  }
  try { var saved = localStorage.getItem("abs-theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  paintToggle();
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".theme-btn");
    if (!b) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("abs-theme", next); } catch (err) {}
    paintToggle();
    document.dispatchEvent(new Event("themechange"));
  });

  /* ---------- copy buttons ---------- */
  function copyText(text, btn) {
    var label = btn.querySelector("[data-copy-label]") || btn;
    var original = label.textContent;
    function done(msg) { label.textContent = msg; setTimeout(function () { label.textContent = original; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done("Copied"); }, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      done(ok ? "Copied" : "Select and copy manually");
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    e.preventDefault();
    var src = b.getAttribute("data-copy");
    var text = src.charAt(0) === "#" ? (document.querySelector(src) || {}).textContent : src;
    if (text) copyText(text.trim(), b);
  });

  /* ---------- project filters ---------- */
  var filterBar = document.querySelector(".filters");
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-cat]"));
    filterBar.querySelectorAll(".filter").forEach(function (f) {
      var key = f.getAttribute("data-filter");
      var n = key === "all" ? cards.length : cards.filter(function (c) { return c.getAttribute("data-cat").split(" ").indexOf(key) > -1; }).length;
      var s = document.createElement("span"); s.className = "n"; s.textContent = n; f.appendChild(s);
    });
    filterBar.addEventListener("click", function (e) {
      var f = e.target.closest(".filter");
      if (!f) return;
      var key = f.getAttribute("data-filter");
      filterBar.querySelectorAll(".filter").forEach(function (x) { x.setAttribute("aria-pressed", x === f ? "true" : "false"); });
      cards.forEach(function (c) {
        c.hidden = !(key === "all" || c.getAttribute("data-cat").split(" ").indexOf(key) > -1);
      });
    });
  }

  /* ---------- microscope field (illustrative blood film) ---------- */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function Field(canvas) {
    var ctx = canvas.getContext("2d");
    var rand = rng(parseInt(canvas.getAttribute("data-seed") || "7", 10));
    var cells = [], S = 0, dpr = 1, scanY = -1, raf = null, t0 = 0;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function build() {
      cells = [];
      var tries = 0;
      while (cells.length < 46 && tries < 3000) {
        tries++;
        var r = 0.052 + rand() * 0.018;
        var x = rand(), y = rand();
        var dx = x - 0.5, dy = y - 0.5;
        if (Math.sqrt(dx * dx + dy * dy) > 0.5 + r) continue;
        var ok = cells.every(function (c) { var ex = c.x - x, ey = c.y - y; return Math.sqrt(ex * ex + ey * ey) > (c.r + r) * 0.93; });
        if (!ok) continue;
        cells.push({ x: x, y: y, r: r, sq: 0.9 + rand() * 0.18, rot: rand() * Math.PI, kind: "rbc" });
      }
      // mark a few as infected (ring-stage look) and one as a white cell
      var picks = [5, 13, 22, 31];
      picks.forEach(function (i, k) { if (cells[i]) { cells[i].kind = "ring"; cells[i].conf = [0.94, 0.88, 0.91, 0.79][k]; cells[i].a = rand() * 6.28; } });
      if (cells[38]) { cells[38].kind = "wbc"; cells[38].r *= 1.35; cells[38].conf = 0.97; }
    }

    function size() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = Math.max(160, rect.width);
      canvas.width = S * dpr; canvas.height = S * dpr;
      draw();
    }

    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var g = ctx.createRadialGradient(S * 0.5, S * 0.45, S * 0.05, S * 0.5, S * 0.5, S * 0.62);
      g.addColorStop(0, "#fbf5f8"); g.addColorStop(1, "#e3d3de");
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

      cells.forEach(function (c) {
        var x = c.x * S, y = c.y * S, r = c.r * S;
        ctx.save(); ctx.translate(x, y); ctx.rotate(c.rot); ctx.scale(1, c.sq);
        if (c.kind === "wbc") {
          ctx.fillStyle = "#e9dcef"; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
          ctx.fillStyle = "#6a4c9c";
          [[-0.3, -0.2, 0.42], [0.25, -0.25, 0.36], [0.05, 0.3, 0.4]].forEach(function (l) { ctx.beginPath(); ctx.arc(l[0] * r, l[1] * r, l[2] * r, 0, 6.283); ctx.fill(); });
        } else {
          var cg = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
          cg.addColorStop(0, "#f3cfd3"); cg.addColorStop(0.55, "#e4a6ad"); cg.addColorStop(1, "#cf8690");
          ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
          ctx.strokeStyle = "rgba(160,80,95,.35)"; ctx.lineWidth = 1; ctx.stroke();
          if (c.kind === "ring") {
            ctx.strokeStyle = "#5b3f8f"; ctx.lineWidth = Math.max(1.4, r * 0.09);
            ctx.beginPath(); ctx.arc(Math.cos(c.a) * r * 0.35, Math.sin(c.a) * r * 0.35, r * 0.28, 0, 6.283); ctx.stroke();
            ctx.fillStyle = "#3d2470"; ctx.beginPath(); ctx.arc(Math.cos(c.a) * r * 0.35 + r * 0.26, Math.sin(c.a) * r * 0.35, r * 0.1, 0, 6.283); ctx.fill();
          }
        }
        ctx.restore();
      });

      // detections
      var accent = "#0d6a55", ochre = "#b8741f";
      ctx.font = "500 " + Math.max(9, S * 0.026) + "px 'IBM Plex Mono', ui-monospace, monospace";
      cells.forEach(function (c) {
        if (!c.conf) return;
        var x = c.x * S, y = c.y * S, r = c.r * S * 1.18;
        var seen = scanY < 0 || y - r < scanY;
        if (!seen) return;
        var col = c.kind === "wbc" ? ochre : accent;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        var label = (c.kind === "wbc" ? "wbc " : "ring ") + c.conf.toFixed(2);
        var tw = ctx.measureText(label).width + 8, th = Math.max(13, S * 0.036);
        ctx.fillStyle = col; ctx.fillRect(x - r - 1, y - r - th, tw, th);
        ctx.fillStyle = "#ffffff"; ctx.fillText(label, x - r + 3, y - r - th * 0.28);
      });

      if (scanY >= 0) {
        var lg = ctx.createLinearGradient(0, scanY - 30, 0, scanY);
        lg.addColorStop(0, "rgba(13,106,85,0)"); lg.addColorStop(1, "rgba(13,106,85,.22)");
        ctx.fillStyle = lg; ctx.fillRect(0, scanY - 30, S, 30);
        ctx.fillStyle = "rgba(13,106,85,.7)"; ctx.fillRect(0, scanY, S, 1.5);
      }
    }

    function loop(ts) {
      if (!t0) t0 = ts;
      var p = ((ts - t0) % 6000) / 6000; // 6s cycle: 4.2s scan, then hold
      scanY = p < 0.7 ? (p / 0.7) * (S + 40) - 20 : -1;
      draw();
      raf = requestAnimationFrame(loop);
    }

    build(); size();
    window.addEventListener("resize", size);
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !raf) { t0 = 0; raf = requestAnimationFrame(loop); }
          else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; scanY = -1; draw(); }
        });
      }).observe(canvas);
    }
  }
  document.querySelectorAll("canvas.field").forEach(function (c) { Field(c); });

  /* year in footer */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
