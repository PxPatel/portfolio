/* ============================================================
   Priyansh Patel — Portfolio · interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---- film grain (SVG noise as a CSS var) ---- */
  var noise =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">' +
        '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
        '<feColorMatrix type="saturate" values="0"/></filter>' +
        '<rect width="100%" height="100%" filter="url(#n)" opacity="0.6"/></svg>',
    );
  document.documentElement.style.setProperty("--noise", 'url("' + noise + '")');

  /* ---- topbar: dark over the beige hero, solid-navy once past the descent ---- */
  var topbar = document.getElementById("topbar");
  var navyStart = document.getElementById("navy-start");
  function onScroll() {
    var overLight = true;
    if (navyStart) {
      overLight = navyStart.getBoundingClientRect().top > 64;
    } else {
      overLight = window.scrollY < window.innerHeight * 0.6;
    }
    topbar.classList.toggle("over-light", overLight);
    topbar.classList.toggle("solid", !overLight);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- card flip (click + keyboard) ---- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    var title = card.querySelector(".ptitle");
    card.setAttribute(
      "aria-label",
      (title ? title.textContent : "project") + " — flip card",
    );
    function toggle() {
      card.classList.toggle("flipped");
    }
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
    // don't flip when clicking a real link on the back
    card.querySelectorAll(".card-back a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
  });

  /* ---- reveal-on-scroll + staggered card deal ---- */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains("cards-row")) {
          var cards = el.querySelectorAll(".card");
          cards.forEach(function (c, i) {
            setTimeout(function () {
              c.classList.add("in");
            }, i * 120);
          });
        } else {
          el.classList.add("in");
        }
        io.unobserve(el);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    io.observe(el);
  });
  document.querySelectorAll(".cards-row").forEach(function (el) {
    io.observe(el);
  });

  /* ---- pointer tilt + glare on project cards ---- */
  var prefersReduce = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  if (!prefersReduce && canHover) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        if (card.classList.contains("flipped")) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var ry = (px - 0.5) * 8; // rotateY — left/right
        var rx = (0.5 - py) * 9; // rotateX — up/down
        card.classList.add("tilting");
        card.classList.remove("tilt-rest");
        card.style.transform =
          "rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg) scale(1.02)";
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("tilting");
        card.classList.add("tilt-rest");
        card.style.transform = "";
      });
    });
  }

  /* ---- ghost-suit scroll parallax ---- */
  var ghosts = Array.prototype.slice.call(
    document.querySelectorAll(".suite-ghost"),
  );
  if (!prefersReduce && ghosts.length) {
    var gRaf = null;
    function driftGhosts() {
      var vh = window.innerHeight;
      ghosts.forEach(function (g) {
        var r = g.getBoundingClientRect();
        var prog = (r.top + r.height / 2 - vh / 2) / vh; // ~ -1..1
        var dy = -prog * 110;
        var rot = prog * 6;
        g.style.transform =
          "translateY(calc(-50% + " +
          dy.toFixed(1) +
          "px)) rotate(" +
          rot.toFixed(2) +
          "deg)";
      });
      gRaf = null;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!gRaf) gRaf = requestAnimationFrame(driftGhosts);
      },
      { passive: true },
    );
    window.addEventListener(
      "resize",
      function () {
        if (!gRaf) gRaf = requestAnimationFrame(driftGhosts);
      },
      { passive: true },
    );
    driftGhosts();
  }

  /* ---- one-time flip hint: nudge the first card so people discover the backs ---- */
  if (!prefersReduce) {
    var firstRow = document.querySelector(".cards-row");
    if (firstRow) {
      var hinted = false;
      var ho = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting || hinted) return;
            hinted = true;
            ho.disconnect();
            var card = firstRow.querySelector(".card");
            if (!card) return;
            setTimeout(function () {
              if (card.classList.contains("flipped")) return; // user beat us to it
              card.classList.add("flipped", "hint-flip");
              setTimeout(function () {
                card.classList.remove("flipped");
                setTimeout(function () {
                  card.classList.remove("hint-flip");
                }, 900);
              }, 1250);
            }, 950); // let the deal-in settle first
          });
        },
        { threshold: 0.55 },
      );
      ho.observe(firstRow);
    }
  }

  /* ---- cursor parallax on the hero light ---- */
  var hero = document.querySelector(".hero");
  var parEls = document.querySelectorAll(".hero [data-par]");
  var tx = 0,
    ty = 0,
    cx = 0,
    cy = 0,
    raf = null;
  function loop() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    parEls.forEach(function (el) {
      var d = parseFloat(el.getAttribute("data-par")) || 1;
      el.style.transform =
        "translate(-50%,-50%) translate(" + cx * d + "px," + cy * d + "px)";
    });
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1)
      raf = requestAnimationFrame(loop);
    else raf = null;
  }
  if (hero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 46;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 30;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener("mouseleave", function () {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---- résumé placeholder ---- */
  document.querySelectorAll("[data-resume]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var msg = document.createElement("div");
      msg.textContent = "Résumé PDF — drop the real file in and link it here.";
      msg.style.cssText =
        "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:200;" +
        "background:var(--paper);color:var(--ink);font-family:var(--mono);font-size:.74rem;" +
        "letter-spacing:.04em;padding:13px 20px;border-radius:999px;box-shadow:0 12px 40px rgba(0,0,0,.5);" +
        "opacity:0;transition:opacity .3s,transform .4s;";
      document.body.appendChild(msg);
      requestAnimationFrame(function () {
        msg.style.opacity = "1";
        msg.style.transform = "translateX(-50%) translateY(-6px)";
      });
      setTimeout(function () {
        msg.style.opacity = "0";
        setTimeout(function () {
          msg.remove();
        }, 350);
      }, 2600);
    });
  });

  /* ---- smooth anchor offset for fixed bar ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  /* ============================================================
     ROYAL-FLUSH HERO — deal the flush, then resolve into the name
     ============================================================ */
  (function () {
    var stage = document.getElementById("rf-stage");
    var felt = document.getElementById("rf-felt");
    var cardsWrap = document.getElementById("rf-cards");
    var deckWrap = document.getElementById("rf-deck");
    var heroR = document.getElementById("hero-r");
    var cue = document.getElementById("hero-r-cue");
    var skipBtn = document.getElementById("rf-skip");
    var grain = document.getElementById("rf-grain");
    if (!stage || !felt) return;

    /* warm grain for the beige stage */
    var n =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
          '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/>' +
          '<feColorMatrix type="saturate" values="0"/></filter>' +
          '<rect width="100%" height="100%" filter="url(#g)"/></svg>',
      );
    grain.style.background = 'url("' + n + '") repeat';
    grain.style.backgroundSize = "200px 200px";

    var ranks = ["A", "K", "Q", "J", "10"];
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* residual deck — the source the hand is drawn from */
    for (var d = 0; d < 5; d++) {
      var b = document.createElement("div");
      b.className = "rf-card rf-deckcard";
      b.innerHTML =
        '<div class="rf-centerer"><div class="rf-face rf-back"></div></div>';
      b.style.zIndex = String(d);
      b.style.transform =
        "translate(" +
        (d - 2) * 0.5 +
        "px, " +
        (96 - d * 1.5) +
        "px) rotate(" +
        (d - 2) * 0.7 +
        "deg)";
      deckWrap.appendChild(b);
    }

    /* the five hero cards: A K Q J 10 of hearts */
    var cards = [];
    ranks.forEach(function (rk) {
      var c = document.createElement("div");
      c.className = "rf-card";
      c.innerHTML =
        '<div class="rf-centerer"><div class="rf-float"><div class="rf-flipper">' +
        '<div class="rf-face rf-back"></div>' +
        '<div class="rf-face rf-front">' +
        '<span class="rf-idx tl"><span class="r">' +
        rk +
        '</span><span class="p">♥</span></span>' +
        '<div class="rf-pip"><div class="stack"><span class="big">' +
        rk +
        '</span><span class="heart">♥</span></div></div>' +
        '<span class="rf-idx br"><span class="r">' +
        rk +
        '</span><span class="p">♥</span></span>' +
        "</div>" +
        '<div class="rf-shine"></div>' +
        "</div></div></div>";
      cardsWrap.appendChild(c);
      cards.push(c);
    });

    function deckT(i) {
      return (
        "translate(" +
        (i - 2) * 0.5 +
        "px, " +
        (88 - i * 1.5) +
        "px) rotate(" +
        (i - 2) * 0.7 +
        "deg)"
      );
    }
    function fanXYR(i) {
      var cen = cards[0].querySelector(".rf-centerer");
      var cw = (cen ? cen.getBoundingClientRect().width : 0) || 150;
      var spacing = cw * 0.7;
      return {
        x: (i - 2) * spacing,
        y: -58 + Math.abs(i - 2) * 14,
        rot: (i - 2) * 8.5,
      };
    }
    function fanT(i) {
      var p = fanXYR(i);
      return "translate(" + p.x + "px, " + p.y + "px) rotate(" + p.rot + "deg)";
    }
    function exitT(i) {
      var p = fanXYR(i);
      return (
        "translate(" +
        p.x +
        "px, " +
        (p.y - 210) +
        "px) rotate(" +
        p.rot +
        "deg) scale(.94)"
      );
    }

    var timers = [];
    function later(fn, ms) {
      timers.push(setTimeout(fn, ms));
    }
    function clearT() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    var resolved = false;

    /* stack the cards on the deck, face-down */
    cards.forEach(function (c, i) {
      c.style.transition = "none";
      c.style.transform = deckT(i);
      c.querySelector(".rf-flipper").style.transform = "rotateY(180deg)";
      c.style.zIndex = String(20 - i);
    });
    void felt.offsetWidth;

    function showHero() {
      heroR.classList.add("show");
      cue.classList.add("show");
      document.body.classList.add("intro-done");
      onScroll();
    }

    function resolve() {
      if (resolved) return;
      resolved = true;
      cards.forEach(function (c, i) {
        later(function () {
          c.style.transition = "transform 1.05s var(--ease), opacity .9s ease";
          c.style.transform = exitT(i);
          c.style.opacity = "0";
        }, i * 70);
      });
      deckWrap.style.transition = "opacity .7s ease";
      deckWrap.style.opacity = "0";
      later(showHero, 240);
      later(function () {
        cardsWrap.style.display = "none";
        deckWrap.style.display = "none";
      }, 1500);
    }

    function deal() {
      cards.forEach(function (c, i) {
        var fl = c.querySelector(".rf-flipper");
        var fo = c.querySelector(".rf-float");
        var t0 = 320 + i * 230;
        later(function () {
          c.style.transition = "transform .82s var(--ease)";
          c.style.transform = fanT(i);
          c.style.zIndex = String(30 + i);
        }, t0);
        later(function () {
          fl.style.transition = "transform .72s var(--ease-flip)";
          fl.style.transform = "rotateY(0deg)";
          c.classList.add("rf-lit");
        }, t0 + 420);
        later(function () {
          fo.classList.add("rf-settle");
          fo.style.animationDelay = i * 0.4 + "s";
        }, t0 + 1250);
      });
      var done = 320 + 4 * 230 + 420 + 720;
      later(resolve, done + 650);
    }

    function skip() {
      clearT();
      resolved = true;
      cards.forEach(function (c) {
        c.style.transition = "none";
        c.style.opacity = "0";
      });
      cardsWrap.style.display = "none";
      deckWrap.style.display = "none";
      showHero();
    }

    skipBtn.addEventListener("click", skip);
    stage.addEventListener("click", function () {
      if (!resolved) skip();
    });
    window.addEventListener("resize", function () {
      if (resolved) return;
      cards.forEach(function (c, i) {
        c.style.transition = "none";
        c.style.transform = fanT(i);
      });
    });

    if (reduce) {
      skip();
    } else {
      deal();
    }
  })();
})();
