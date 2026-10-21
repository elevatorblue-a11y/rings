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

  // Worlds: one tab per world, and a panel with its screenshot, welcome line and ten creatures.
  var tabs = document.getElementById("world-tabs"), panel = document.getElementById("world-panel");
  if (tabs && panel) {
    function show(index, focus) {
      var w = worlds[index];
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
          el("img", { src: "assets/img/creatures/L" + l.n + ".png", alt: "", loading: "lazy" }),
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
      panel.replaceChildren.apply(panel, screws.concat([el("div", { class: "world" }, [figure, plate])]));
    }
    worlds.forEach(function (w, i) {
      var tab = el("button", { class: "tab", role: "tab", id: "tab-" + w.key, "aria-controls": "world-panel", type: "button", text: w.name });
      tab.style.setProperty("--c", colorOf(w));
      tab.addEventListener("click", function () { show(i, false); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          show((i + (e.key === "ArrowRight" ? 1 : worlds.length - 1)) % worlds.length, true);
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
    var img = fact.querySelector(".who img");
    // Shows the current fact; the promise settles once its creature's picture is ready to draw.
    function render() {
      var x = all[current];
      fact.style.setProperty("--c", colorOf(x.w));
      img.src = "assets/img/creatures/L" + x.l.n + ".png";
      fact.querySelector(".tag").textContent = tagOf(x);
      fact.querySelector("blockquote").textContent = x.f;
      return (img.decode ? img.decode() : Promise.resolve()).catch(function () {});
    }
    // The old fact fades and drops away, then the new one rises in once its picture has loaded (instantly with
    // reduced motion).
    var still = window.matchMedia("(prefers-reduced-motion: reduce)"), swapping = false;
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
