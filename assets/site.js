// The world picker and the fun-fact card on the home page. Data comes from data.js (window.RINGS_WORLDS).
(function () {
  var worlds = window.RINGS_WORLDS || [];
  if (!worlds.length) return;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k]; else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }
  function colorOf(world) { return "var(--" + world.key + ")"; }
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  // A creature's picture, idling gently (see .pic in site.css): plants sway from their base, space machines hover and
  // everyone else bobs, each at its own pace. Those with eyelids in the game also blink now and then, with an eyes-shut
  // copy of the picture on top (creatures/blink/L<n>.png, painted by the game project's Tools/scripts/site/make_blinks.sh).
  var BLINKS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 13, 14, 15, 16, 17, 19, 20, 26, 28, 34, 36, 37, 38, 39, 40, 41, 43, 45, 46, 47, 49,
                50, 51, 52, 53, 54, 67, 68, 69, 70, 71, 72, 73, 75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87];
  var SWAY = [9, 11, 24, 27, 35, 48, 74], HOVER = [21, 22, 23, 25, 29, 30];
  function pic(n) {
    var kind = SWAY.indexOf(n) >= 0 ? " sway" : HOVER.indexOf(n) >= 0 ? " hover" : "";
    var blinks = BLINKS.indexOf(n) >= 0;
    var box = el("div", { class: "pic" + kind + (blinks ? " blinks" : "") }, [el("img", { src: "assets/img/creatures/L" + n + ".png", alt: "", loading: "lazy" })]);
    if (blinks) box.appendChild(el("img", { class: "shut", src: "assets/img/creatures/blink/L" + n + ".png", alt: "", loading: "lazy", "aria-hidden": "true" }));
    box.style.setProperty("--dur", (3.6 + Math.random() * 2).toFixed(2) + "s");
    box.style.setProperty("--delay", (-Math.random() * 5).toFixed(2) + "s");
    return box;
  }
  // Blinks: every few seconds, at random, each creature shows its eyes-shut picture for a moment (now and then twice),
  // as the game's creatures do.
  function blink(p) { p.classList.add("shut"); setTimeout(function () { p.classList.remove("shut"); }, 140); }
  if (!still.matches) setInterval(function () {
    var now = Date.now();
    document.querySelectorAll(".pic.blinks").forEach(function (p) {
      var due = Number(p.dataset.due) || 0;
      if (!due) { p.dataset.due = now + 1500 + Math.random() * 7000; return; }
      if (now < due) return;
      p.dataset.due = now + 3500 + Math.random() * 6000;
      blink(p);
      if (Math.random() < 0.2) setTimeout(function () { blink(p); }, 280);
    });
  }, 200);

  // Worlds: one tab per world, and a panel with its screenshot, welcome line and ten creatures.
  var tabs = document.getElementById("world-tabs"), panel = document.getElementById("world-panel");
  if (tabs && panel) {
    // A new world: the panel's colour blends across while the old world fades and drops away, then the new one rises
    // in (its phone first, then its words, then its creatures; see .entering in site.css). Instant with reduced motion.
    var turn = 0;
    function show(index, focus, animate) {
      var w = worlds[index], mine = ++turn;
      Array.prototype.forEach.call(tabs.children, function (t, i) {
        t.setAttribute("aria-selected", i === index ? "true" : "false");
        t.tabIndex = i === index ? 0 : -1;
        if (i === index && focus) t.focus();
      });
      panel.style.setProperty("--shell", colorOf(w));
      panel.style.setProperty("--c", colorOf(w));
      panel.setAttribute("aria-labelledby", "tab-" + w.key);
      var grid = el("div", { class: "creatures" }, w.levels.map(function (l) {
        return el("div", { class: "creature" }, [
          pic(l.n),
          el("b", { text: l.creature }),
          el("span", { text: l.name })
        ]);
      }));
      var figure = el("figure", { class: "phone" }, [el("picture", {}, [
        el("source", { srcset: "assets/img/phones/" + w.key + ".avif", type: "image/avif" }),
        el("img", { src: "assets/img/phones/" + w.key + ".png", alt: "Rings! on iPhone in " + w.title, width: "640", height: "1308", loading: "lazy" })
      ])]);
      var plate = el("div", { class: "plate world-plate" }, [
        el("p", { class: "count", text: "World " + (index + 1) + " · 10 levels and a bonus round" }),
        el("h3", { text: w.title }),
        el("p", { class: "welcome", text: w.welcome }),
        grid
      ]);
      var screws = ["tl", "tr", "bl", "br"].map(function (c) { return el("span", { class: "screw " + c, "aria-hidden": "true" }); });
      var world = el("div", { class: "world" }, [figure, plate]);
      if (!animate || still.matches) { panel.classList.remove("leaving"); panel.replaceChildren.apply(panel, screws.concat([world])); return; }
      panel.classList.add("leaving");
      setTimeout(function () {
        if (mine !== turn) return;     // (another tab was picked meanwhile)
        world.classList.add("entering");
        panel.replaceChildren.apply(panel, screws.concat([world]));
        panel.classList.remove("leaving");
        var phone = figure.querySelector("img");
        phone.loading = "eager";
        // (Waits for the phone picture, but not for long: it may be off screen, or the network slow.)
        var ready = Promise.race([phone.decode ? phone.decode().catch(function () {}) : Promise.resolve(),
                                  new Promise(function (done) { setTimeout(done, 300); })]);
        ready.then(function () {
          if (mine !== turn) return;
          void world.offsetWidth;     // (so the browser draws the hidden state before it eases out of it)
          world.classList.remove("entering");
        });
      }, 180);
    }
    worlds.forEach(function (w, i) {
      var tab = el("button", { class: "tab", role: "tab", id: "tab-" + w.key, "aria-controls": "world-panel", type: "button", text: w.name });
      tab.style.setProperty("--c", colorOf(w));
      tab.addEventListener("click", function () { if (tab.getAttribute("aria-selected") !== "true") show(i, false, true); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          show((i + (e.key === "ArrowRight" ? 1 : worlds.length - 1)) % worlds.length, true, true);
        }
      });
      tabs.appendChild(tab);
    });
    show(0, false);
  }

  // Fun facts: start with the dolphins' whistles, then any fact from any creature.
  var fact = document.getElementById("fact");
  if (fact) {
    var all = [];
    worlds.forEach(function (w) { w.levels.forEach(function (l) { l.facts.forEach(function (f) { all.push({ w: w, l: l, f: f }); }); }); });
    var current = Math.max(0, all.findIndex(function (x) { return x.f.indexOf("whistle") >= 0; }));
    function tagOf(x) { return x.l.creature + " · " + x.w.title; }
    // The card keeps one size: invisible copies of the longest tags and facts sit in the same spot as the real ones.
    function room(box, texts, tag) {
      texts.filter(function (t, i) { return texts.indexOf(t) === i; })
        .sort(function (a, b) { return b.length - a.length; }).slice(0, 15)
        .forEach(function (t) { box.appendChild(el(tag, { class: tag === "span" ? "tag room" : "room", "aria-hidden": "true", text: t })); });
    }
    var steady = fact.querySelectorAll(".steady");
    room(steady[0], all.map(tagOf), "span");
    room(steady[1], all.map(function (x) { return x.f; }), "blockquote");
    var who = fact.querySelector(".who");
    // Shows the current fact; the promise settles once its creature's picture is ready to draw.
    function render() {
      var x = all[current];
      fact.style.setProperty("--c", colorOf(x.w));
      var p = pic(x.l.n), img = p.querySelector("img");
      img.loading = "eager";
      who.replaceChildren(p);
      fact.querySelector(".tag").textContent = tagOf(x);
      fact.querySelector("blockquote").textContent = x.f;
      // (Waits for the picture, but not for long: it may be off screen, or the network slow.)
      return Promise.race([img.decode ? img.decode().catch(function () {}) : Promise.resolve(),
                           new Promise(function (done) { setTimeout(done, 300); })]);
    }
    // The old fact fades and drops away, then the new one rises in once its picture has loaded (instantly with
    // reduced motion).
    var swapping = false;
    fact.querySelector(".more").addEventListener("click", function () {
      if (swapping) return;
      var next = current;
      while (all.length > 1 && (next === current || all[next].l.n === all[current].l.n)) next = Math.floor(Math.random() * all.length);
      current = next;
      if (still.matches) { render(); return; }
      swapping = true;
      fact.classList.add("leaving");
      setTimeout(function () {
        render().then(function () { fact.classList.remove("leaving"); swapping = false; });
      }, 180);
    });
    render();
  }
})();
