/* ==========================================================================
   LebzCafe - Site script
   1. CONFIG (edit phone number, hours and WhatsApp messages here)
   2. Interface (preloader, nav, reveal, parallax, tilt, counters, beans)
   3. Live opening hours
   4. WhatsApp automation
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. CONFIG
     ------------------------------------------------------------------ */
  var CONFIG = {
    // International format, no plus sign, no spaces: 078 322 5938 -> 27 78 322 5938
    whatsappNumber: "27783225938",
    businessName: "LebzCafé",
    timeZone: "Africa/Johannesburg",
    address: "18 Jordaan St, Eastleigh, Edenvale, 1609",

    // Opening hours in minutes after midnight. Keys: 0 = Sunday ... 6 = Saturday
    hours: {
      1: [6 * 60 + 30, 18 * 60 + 30], // Monday
      2: [6 * 60 + 30, 18 * 60 + 30], // Tuesday
      3: [6 * 60 + 30, 18 * 60 + 30], // Wednesday
      4: [8 * 60 + 30, 18 * 60 + 30], // Thursday
      5: [8 * 60 + 30, 18 * 60 + 30], // Friday
      6: [7 * 60, 18 * 60 + 30],      // Saturday
      0: [7 * 60, 18 * 60 + 30]       // Sunday
    },

    // Automated WhatsApp messages. The key is used in data-wa="key" on any link or button.
    // A message can be text or a function that receives the data-wa-item value.
    messages: {
      general: "I would like to find out more about LebzCafé.",
      order: "I would like to order iKoffie, your 100% freeze dried instant coffee. Please share the available sizes, prices and delivery options.",
      irresistible: "I would like to order the Irresistible freeze dried instant coffee pouch. Please share the available sizes, prices and delivery options.",
      wholesale: "I am interested in stocking iKoffie in my business. Please share wholesale pricing and minimum order quantities.",
      franchise: "I am interested in the LebzCafé franchise and store opportunities. Please send me more information.",
      collab: "I would like to talk about a partnership, collaboration or event with LebzCafé.",
      serve: function (item) { return "I would like to know more about enjoying iKoffie as " + (item || "a coffee") + ". Can you share how you recommend preparing it?"; },
      menu: function (item) { return "I would like to place an order from the LebzCafé menu: " + (item || "a menu item") + ". Please confirm availability and the pickup time."; },
      visit: "I am planning to visit the café in Eastleigh, Edenvale. Can you confirm your opening hours today?",
      directions: "I am on my way to the café at " + "18 Jordaan St, Eastleigh, Edenvale. Please can you confirm you are open?",
      hours: "Could you please confirm your trading hours for this week?",
      story: "I enjoyed reading the LebzCafé story and would like to chat with the team.",
      social: "I found you on social media and would like to know more about LebzCafé."
    }
  };

  var PAGE_NAMES = { "index.html": "Home", "": "Home", "about.html": "About", "contact.html": "Contact" };
  var path = (location.pathname.split("/").pop() || "").toLowerCase();
  var PAGE = PAGE_NAMES[path] || "Website";

  var doc = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  doc.classList.remove("no-js");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ------------------------------------------------------------------
     3. TIME + HOURS HELPERS (Johannesburg time, whatever the visitor's device says)
     ------------------------------------------------------------------ */
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function nowJhb() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone, weekday: "short", hour: "numeric", minute: "numeric", hour12: false
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var h = parseInt(o.hour, 10) % 24;
    return { day: DAY_INDEX[o.weekday], minutes: h * 60 + parseInt(o.minute, 10) };
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? "pm" : "am";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (m ? ":" + (m < 10 ? "0" + m : m) : "") + " " + ap;
  }

  function status() {
    var n = nowJhb();
    var today = CONFIG.hours[n.day];
    if (n.minutes >= today[0] && n.minutes < today[1]) {
      return { open: true, text: "Open now, closes " + fmt(today[1]), short: "Open now" };
    }
    if (n.minutes < today[0]) {
      return { open: false, text: "Closed, opens today at " + fmt(today[0]), short: "Closed" };
    }
    var next = (n.day + 1) % 7;
    return { open: false, text: "Closed, opens " + (next === 0 ? "Sunday" : DAY_NAMES[next]) + " at " + fmt(CONFIG.hours[next][0]), short: "Closed" };
  }

  function greeting() {
    var h = Math.floor(nowJhb().minutes / 60);
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }

  function renderHours() {
    var s = status();
    $$("[data-open-status]").forEach(function (el) {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      var t = $("[data-status-text]", el);
      if (t) t.textContent = s.text;
    });
    $$("[data-today-hours]").forEach(function (el) {
      var d = CONFIG.hours[nowJhb().day];
      el.textContent = "Today " + fmt(d[0]) + " to " + fmt(d[1]);
    });
    var tbody = $("[data-hours-table]");
    if (tbody && !tbody.children.length) {
      var today = nowJhb().day;
      [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
        var tr = document.createElement("tr");
        if (d === today) tr.className = "today";
        tr.innerHTML = "<th scope=\"row\">" + DAY_NAMES[d] + "</th><td>" + fmt(CONFIG.hours[d][0]) + " to " + fmt(CONFIG.hours[d][1]) + "</td>";
        tbody.appendChild(tr);
      });
    }
  }
  renderHours();
  setInterval(renderHours, 60000);

  /* ------------------------------------------------------------------
     4. WHATSAPP AUTOMATION
     ------------------------------------------------------------------ */
  function buildMessage(key, item, extra) {
    var m = CONFIG.messages[key] || CONFIG.messages.general;
    var text = typeof m === "function" ? m(item) : m;
    var out = greeting() + " " + CONFIG.businessName + " team. " + text;
    if (extra) out += "\n\n" + extra;
    out += "\n\n(Sent from the " + CONFIG.businessName + " website, " + PAGE + " page)";
    return out;
  }

  function waLink(key, item, extra) {
    return "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(buildMessage(key, item, extra));
  }

  function wireWhatsApp(root) {
    $$("[data-wa]", root).forEach(function (a) {
      if (a.tagName === "A") {
        a.href = waLink(a.getAttribute("data-wa"), a.getAttribute("data-wa-item"));
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });
  }

  // Refresh the message right before the click so the greeting and wording are current.
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-wa]") : null;
    if (!el) return;
    var link = waLink(el.getAttribute("data-wa"), el.getAttribute("data-wa-item"));
    if (el.tagName === "A") {
      el.href = link;
    } else {
      e.preventDefault();
      window.open(link, "_blank", "noopener");
    }
  });
  wireWhatsApp();

  // Floating widget
  (function buildFloat() {
    var options = [
      ["Order iKoffie", "order"],
      ["Order from the menu", "menu"],
      ["Wholesale or stockist", "wholesale"],
      ["Franchise enquiry", "franchise"],
      ["Confirm opening hours", "hours"],
      ["Partnership or event", "collab"]
    ];
    var wrap = document.createElement("div");
    wrap.className = "wa-float";
    var list = options.map(function (o) {
      return "<a data-wa=\"" + o[1] + "\" " + (o[1] === "menu" ? "data-wa-item=\"an item from your menu\"" : "") + "><span>" + o[0] + "</span><svg class=\"icon icon-stroke\" aria-hidden=\"true\"><use href=\"#i-arrow\"/></svg></a>";
    }).join("");
    wrap.innerHTML =
      "<div class=\"wa-panel\" id=\"wa-panel\" role=\"dialog\" aria-label=\"Chat with LebzCafé on WhatsApp\">" +
        "<header><img src=\"images/favicon.png\" alt=\"\"><div><b>LebzCafé</b><small data-wa-status>Typically replies during opening hours</small></div></header>" +
        "<div class=\"body\"><div class=\"bubble\">Hello and welcome. Choose what you need and we will open WhatsApp with the message ready to send.</div>" + list + "</div>" +
      "</div>" +
      "<button class=\"wa-fab\" aria-label=\"Chat on WhatsApp\" aria-expanded=\"false\" aria-controls=\"wa-panel\"><svg class=\"icon\" aria-hidden=\"true\"><use href=\"#i-wa\"/></svg></button>";
    body.appendChild(wrap);
    wireWhatsApp(wrap);
    var fab = $(".wa-fab", wrap);
    var stat = $("[data-wa-status]", wrap);
    function setStatus() { stat.textContent = status().text; }
    setStatus();
    function toggle(force) {
      var open = typeof force === "boolean" ? force : !wrap.classList.contains("open");
      wrap.classList.toggle("open", open);
      fab.setAttribute("aria-expanded", open);
      if (open) setStatus();
    }
    fab.addEventListener("click", function () { toggle(); });
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) toggle(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
    wrap.addEventListener("click", function (e) { if (e.target.closest("a[data-wa]")) toggle(false); });
  })();

  // Contact form to WhatsApp
  var form = $("[data-wa-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone, topic = form.elements.topic, msg = form.elements.message;
      var ok = true;
      function check(field, valid, text) {
        var wrapF = field.closest(".field");
        wrapF.classList.toggle("invalid", !valid);
        $(".err", wrapF).textContent = valid ? "" : text;
        if (!valid) ok = false;
      }
      check(name, name.value.trim().length >= 2, "Please enter your name.");
      check(msg, msg.value.trim().length >= 3, "Please write a short message.");
      if (phone.value.trim()) check(phone, /^[0-9+\s()-]{7,}$/.test(phone.value.trim()), "Please enter a valid phone number.");
      else check(phone, true, "");
      if (!ok) return;
      var extra = "My name is " + name.value.trim() + "." +
        (phone.value.trim() ? " You can reach me on " + phone.value.trim() + "." : "") +
        "\n\nMessage: " + msg.value.trim();
      window.open(waLink(topic.value, null, extra), "_blank", "noopener");
      var done = $("[data-form-done]", form);
      if (done) { done.hidden = false; }
    });
  }

  /* ------------------------------------------------------------------
     2. INTERFACE
     ------------------------------------------------------------------ */
  var year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Preloader (first visit per session only)
  var pre = $(".preloader");
  var seen = false;
  try { seen = sessionStorage.getItem("lebz-seen") === "1"; } catch (e) {}
  function endPreload() {
    if (!pre) return;
    pre.classList.add("is-done");
    body.classList.remove("is-loading");
    try { sessionStorage.setItem("lebz-seen", "1"); } catch (e) {}
  }
  if (pre) {
    if (seen || reduceMotion) {
      pre.remove();
      body.classList.remove("is-loading");
      body.classList.add("no-preload");
    } else {
      window.addEventListener("load", function () { setTimeout(endPreload, 1500); });
      setTimeout(endPreload, 3500); // safety net
    }
  }

  // Nav: scrolled state, hide on scroll down, mobile menu
  var header = $(".site-header");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) {
      header.classList.toggle("scrolled", y > 30);
      header.classList.toggle("hide", y > lastY && y > 400 && !body.classList.contains("nav-open"));
    }
    lastY = y;
    var bar = $(".progress");
    if (bar) {
      var h = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    }
    parallax(y);
  }
  var toggleBtn = $(".nav-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggleBtn.setAttribute("aria-expanded", open);
    });
    $$(".nav-links a").forEach(function (a, i) {
      a.style.setProperty("--i", i);
      a.addEventListener("click", function () { body.classList.remove("nav-open"); toggleBtn.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { body.classList.remove("nav-open"); toggleBtn.setAttribute("aria-expanded", "false"); } });
  }

  // Parallax
  var pEls = $$("[data-speed]");
  function parallax(y) {
    if (reduceMotion) return;
    pEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var speed = parseFloat(el.getAttribute("data-speed"));
      var offset = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    });
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  onScroll();

  // Reveal on scroll
  var revealEls = $$(".reveal, .clip, .media-frame");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // Counters
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, end = parseFloat(el.getAttribute("data-count")), suffix = el.getAttribute("data-suffix") || "";
        var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
        if (reduceMotion) { el.textContent = end.toFixed(dec) + suffix; return; }
        var start = null, dur = 1800;
        (function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
          el.textContent = (end * eased).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // 3D tilt with glare
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach(function (card) {
      var glare = document.createElement("span");
      glare.className = "glare";
      card.appendChild(glare);
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * 8).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * 10).toFixed(2) + "deg) translateY(-4px)";
        card.style.setProperty("--gx", (x * 100) + "%");
        card.style.setProperty("--gy", (y * 100) + "%");
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });

    // Magnetic buttons
    $$(".btn, .wa-fab").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.32;
        b.style.transform = "translate(" + x.toFixed(1) + "px," + (y - 3).toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });

    // Cursor glow
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    body.appendChild(glow);
    var gx = 0, gy = 0, tx = 0, ty = 0, raf = null;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY; glow.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = "translate3d(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px,0)";
      raf = (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) ? requestAnimationFrame(loop) : null;
    }
  }

  // Falling coffee beans in the hero
  var beanBox = $(".hero-beans");
  if (beanBox && !reduceMotion) {
    var count = window.innerWidth < 700 ? 9 : 18;
    for (var i = 0; i < count; i++) {
      var b = document.createElement("i");
      b.className = "bean";
      var s = 10 + Math.random() * 22;
      b.style.cssText =
        "left:" + (Math.random() * 100).toFixed(1) + "%;" +
        "--s:" + s.toFixed(1) + "px;" +
        "--t:" + (14 + Math.random() * 18).toFixed(1) + "s;" +
        "--dl:-" + (Math.random() * 30).toFixed(1) + "s;" +
        "--x:" + ((Math.random() - 0.5) * 220).toFixed(0) + "px;" +
        "--r:" + ((Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360)).toFixed(0) + "deg;" +
        "--o:" + (0.25 + Math.random() * 0.5).toFixed(2) + ";" +
        "--b:" + (s < 16 ? "1.5px" : "0px");
      beanBox.appendChild(b);
    }
  }

  // Split hero headline into words for the reveal animation
  $$("[data-split]").forEach(function (h) {
    var w = 0;
    $$(".line", h).forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words.map(function (t) { return "<span class=\"word\" style=\"--w:" + (w++) + "\">" + t + "</span>"; }).join(" ");
    });
  });

  // Soft page transition for internal links
  $$("a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || /^(https?:|mailto:|tel:|#)/.test(href) || a.target === "_blank" || a.hasAttribute("data-wa")) return;
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || reduceMotion) return;
      var samePage = href.split("#")[0] === "" || href.split("#")[0].toLowerCase() === path;
      if (samePage) return;
      e.preventDefault();
      body.classList.add("is-leaving");
      setTimeout(function () { location.href = href; }, 280);
    });
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted) body.classList.remove("is-leaving"); });
})();
