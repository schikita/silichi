// assets/js/main.js

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const throttle = (func, limit) => {
  let inThrottle = false;
  return (...args) => {
    if (inThrottle) return;
    inThrottle = true;
    func(...args);
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
};

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const lockScroll = (locked) => {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  document.body.style.overflow = locked ? "hidden" : "";
};

const prefersReducedMotion = () =>
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

document.addEventListener("DOMContentLoaded", () => {
  initScrollProgress();
  initHeaderScrollState();
  initMobileNav();
  initHeroSlider();
  initDataBg();
  initReveals();
  initBackToTop();
  initLightbox();
  initGallery70();
  initMiniCollage();
  initCollageSection();
  initSliders();
  initProjectsCarousel();
  initSkiGame();
  initGalleryControls();
});

function initScrollProgress() {
  const scrollProgress = qs(".scroll-progress");
  if (!scrollProgress) return;

  const update = throttle(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
    scrollProgress.style.transform = `scaleX(${scrollPercent})`;
  }, 50);

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initHeaderScrollState() {
  const header = qs(".header");
  if (!header) return;

  const update = throttle(() => {
    header.classList.toggle("scrolled", window.scrollY > 12);
  }, 80);

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initMobileNav() {
  const navToggle = qs(".nav-toggle");
  const mobileNav = qs("#mobileNav");
  if (!navToggle || !mobileNav) return;

  const setOpen = (open) => {
    navToggle.classList.toggle("active", open);
    mobileNav.classList.toggle("active", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    lockScroll(open);
  };

  navToggle.addEventListener("click", () => {
    setOpen(!mobileNav.classList.contains("active"));
  });

  qsa("a", mobileNav).forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth > 767) setOpen(false);
    }, 250)
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav.classList.contains("active")) {
      setOpen(false);
    }
  });
}

function initHeroSlider() {
  const sliderRoot = qs("[data-hero-slider]");
  if (!sliderRoot || prefersReducedMotion()) return;

  const slides = qsa(".hero-slide", sliderRoot);
  if (slides.length < 2) return;

  let idx = 0;
  const intervalMs = 5200;

  setInterval(() => {
    slides[idx].classList.remove("active");
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add("active");
  }, intervalMs);
}

function initDataBg() {
  const nodes = qsa("[data-bg]");

  nodes.forEach((el) => {
    const raw = el.getAttribute("data-bg");
    if (!raw) return;

    let url;

    // Абсолютный URL (http, https, //)
    if (/^(https?:)?\/\//.test(raw)) {
      url = raw;
    }
    // Абсолютный путь от корня сайта
    else if (raw.startsWith("/")) {
      url = raw;
    }
    // Относительный путь → приводим к абсолютному от текущего документа
    else {
      url = new URL(raw, document.baseURI).href;
    }

    el.style.setProperty("--bg-image", `url("${url}")`);
  });
}

function initReveals() {
  const candidates = [
    ".chapter",
    ".text-block",
    ".feature",
    ".slider",
    ".mini-collage-wrap",
    ".grid-item",
    ".projects-stage .project-card",
    ".section-header",
    ".gallery-toolbar",
    ".game-container",
  ];

  const els = candidates.flatMap((s) => qsa(s)).filter(Boolean);

  els.forEach((el, i) => {
    el.classList.add("reveal");
    if (el.classList.contains("chapter") || el.classList.contains("feature")) {
      el.classList.add(i % 2 === 0 ? "reveal--left" : "reveal--right");
      return;
    }
    el.classList.add(
      i % 3 === 0
        ? "reveal--left"
        : i % 3 === 1
        ? "reveal--right"
        : "reveal--up"
    );
  });

  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -80px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

function initBackToTop() {
  const btn = qs("#backToTop");
  if (!btn) return;

  const toggle = throttle(() => {
    btn.classList.toggle("visible", window.scrollY > 420);
  }, 120);

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}

/* ========== LIGHTBOX (общий для галереи, коллажей, мини-коллажей) ========== */

let LIGHTBOX_IMAGES = [];
let lightboxIndex = 0;

function initLightbox() {
  const lightbox = qs("#lightbox");
  const img = qs("#lightboxImage");
  const closeBtn = qs(".lightbox-close");
  const prevBtn = qs(".lightbox-prev");
  const nextBtn = qs(".lightbox-next");

  if (!lightbox || !img) return;

  const open = (index) => {
    if (!LIGHTBOX_IMAGES.length) return;
    lightboxIndex = clamp(index, 0, LIGHTBOX_IMAGES.length - 1);

    img.src = LIGHTBOX_IMAGES[lightboxIndex].src;
    img.alt = LIGHTBOX_IMAGES[lightboxIndex].alt || "";

    lightbox.hidden = false;
    lockScroll(true);
  };

  const close = () => {
    lightbox.hidden = true;
    lockScroll(false);
  };

  const next = () => open((lightboxIndex + 1) % LIGHTBOX_IMAGES.length);
  const prev = () =>
    open((lightboxIndex - 1 + LIGHTBOX_IMAGES.length) % LIGHTBOX_IMAGES.length);

  closeBtn && closeBtn.addEventListener("click", close);
  nextBtn && nextBtn.addEventListener("click", next);
  prevBtn && prevBtn.addEventListener("click", prev);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  let touchStartX = 0;
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      if (touchStartX - touchEndX > 50) next();
      if (touchEndX - touchStartX > 50) prev();
    },
    { passive: true }
  );

  window.__openLightbox = open;
}

/* ========== GALLERY 70 ========== */

function buildGalleryImages(count) {
  const list = [];
  for (let i = 1; i <= count; i += 1) {
    list.push({
      src: `https://source.unsplash.com/1600x1000/?ski,snow,mountain,resort&sig=${i}`,
      thumb: `https://source.unsplash.com/900x700/?ski,snow,mountain,resort&sig=${i}`,
      alt: `Фото ${i}`,
    });
  }
  return list;
}

function initGallery70() {
  const grid = qs("#galleryGrid");
  if (!grid) return;

  const images = buildGalleryImages(70);
  LIGHTBOX_IMAGES = images;

  const frag = document.createDocumentFragment();

  images.forEach((it, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "grid-item";

    if (idx % 17 === 0) wrap.classList.add("large");
    else if (idx % 11 === 0) wrap.classList.add("wide");

    const img = document.createElement("img");
    img.src = it.thumb;
    img.alt = it.alt;
    img.loading = "lazy";
    img.decoding = "async";

    wrap.appendChild(img);
    wrap.addEventListener("click", () => window.__openLightbox(idx));
    frag.appendChild(wrap);
  });

  grid.innerHTML = "";
  grid.appendChild(frag);

  const revealTargets = qsa(".grid-item", grid);
  revealTargets.forEach((el) => {
    if (!el.classList.contains("reveal")) {
      el.classList.add("reveal", "reveal--up");
    }
  });
}

function initGalleryControls() {
  const shuffleBtn = qs("#shuffleGallery");
  const toGameBtn = qs("#scrollToGame");

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (!LIGHTBOX_IMAGES.length) return;
      LIGHTBOX_IMAGES = shuffleArray(LIGHTBOX_IMAGES);
      initGallery70();
      initReveals();
    });
  }

  if (toGameBtn) {
    toGameBtn.addEventListener("click", () => {
      const game = qs("#mini-game");
      if (!game) return;
      game.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========== MINI COLLAGE (5) ========== */
function initMiniCollage() {
  const wrap = qs("[data-mini-collage]");
  if (!wrap) return;

  const items = qsa(".mini-collage__item", wrap);
  if (!items.length) return;

  const urls = items.map((_, i) => ({
    src: `./assets/img/grid-1/${i + 1}.jpg`,
    alt: `Мини-коллаж: фото ${i + 1}`,
  }));

  urls.forEach((it, i) => {
    items[i].style.backgroundImage = `url("${it.src}")`;

    items[i].addEventListener("click", () => {
      // Важно: чтобы lightbox открывал именно эти 5 фото, а не галерею на 70
      LIGHTBOX_IMAGES = urls;
      window.__openLightbox(i);
    });
  });
}

/* ========== COLLAGE SECTION (10) ========== */

function initCollageSection() {
  const root = qs("#photoCollage");
  if (!root) return;

  const basePath = "./assets/img/collage-2";
  const count = 9;

  const collageImages = Array.from({ length: count }, (_, i) => ({
    src: `${basePath}/${i + 1}.jpg`,
    alt: `Коллаж ${i + 1}`,
  }));

  const frag = document.createDocumentFragment();

  collageImages.forEach((it, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "collage-item";
    btn.style.backgroundImage = `url("${it.src}")`;
    btn.setAttribute("aria-label", it.alt);

    btn.addEventListener("click", () => {
      LIGHTBOX_IMAGES = LIGHTBOX_IMAGES.length ? LIGHTBOX_IMAGES : collageImages;
      window.__openLightbox(idx);
    });

    frag.appendChild(btn);
  });

  root.innerHTML = "";
  root.appendChild(frag);
}


/* ========== SLIDERS (generic) ========== */

function initSliders() {
  qsa("[data-slider]").forEach((slider) => setupSlider(slider));
}

function setupSlider(root) {
  const track = qs(".slider-track", root);
  const slides = qsa(".slider-slide", root);
  const prevBtn = qs("button.slider-btn.prev", root);
  const nextBtn = qs("button.slider-btn.next", root);
  const dotsWrap = qs(".slider-dots", root);

  if (!track || slides.length < 2) return;

  let idx = 0;

  const render = () => {
    track.style.transform = `translateX(${-idx * 100}%)`;

    if (dotsWrap) {
      const dots = qsa("span", dotsWrap);
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    }
  };

  const go = (i) => {
    idx = (i + slides.length) % slides.length;
    render();
  };

  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  const buildDots = () => {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = slides.map(() => "<span></span>").join("");
    qsa("span", dotsWrap).forEach((dot, i) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        go(i);
        resetAutoplay();
      });
    });
  };

  // Автоплей (если не reduce motion)
  let timer = null;
  const canAutoplay = !prefersReducedMotion();

  const stopAutoplay = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    if (!canAutoplay) return;
    stopAutoplay();
    timer = setInterval(next, 6500);
  };

  const resetAutoplay = () => {
    startAutoplay();
  };

  buildDots();
  render();
  startAutoplay();

  // Кнопки
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      prev();
      resetAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      next();
      resetAutoplay();
    });
  }

  // Пауза автоплея при наведении (десктоп)
  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);

  // Swipe/pointer — но НЕ стартуем его, если событие началось на кнопке/точках
  let startX = 0;
  let activePointer = false;

  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;

    // Важно: если нажали на кнопку или на точки — свайп не включаем
    if (e.target.closest("button, .slider-dots")) return;

    activePointer = true;
    startX = e.clientX;

    try {
      root.setPointerCapture(e.pointerId);
    } catch (_) {
      // в некоторых окружениях setPointerCapture может быть недоступен
    }
  });

  root.addEventListener("pointerup", (e) => {
    if (!activePointer) return;
    activePointer = false;

    const dx = e.clientX - startX;
    if (Math.abs(dx) < 40) return;

    if (dx < 0) next();
    else prev();

    resetAutoplay();
  });

  root.addEventListener("pointercancel", () => {
    activePointer = false;
  });
}

/* ========== PROJECTS CAROUSEL ========== */

function initProjectsCarousel() {
  const viewport = qs(".projects-viewport");
  if (!viewport) return;

  const stage = qs(".projects-stage", viewport);
  if (!stage) return;

  const cards = qsa(".project-card", stage);
  if (!cards.length) return;

  const dotsWrap = qs(".pr-dots", viewport);
  const prevBtn = qs(".prev", viewport);
  const nextBtn = qs(".next", viewport);

  let i = 0;
  let timer = null;

  const interval = +(viewport.dataset.interval || 5000);
  const autoplay = viewport.dataset.autoplay !== "false";
  const reduce = prefersReducedMotion();

  if (dotsWrap) {
    dotsWrap.innerHTML = cards.map(() => "<i></i>").join("");
  }
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

  const show = (idx) => {
    i = (idx + cards.length) % cards.length;
    cards.forEach((c, k) => c.classList.toggle("is-active", k === i));
    dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
  };

  const next = () => show(i + 1);
  const prev = () => show(i - 1);

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const play = () => {
    if (reduce || !autoplay) return;
    stop();
    timer = setInterval(next, interval);
  };

  show(0);
  play();

  nextBtn &&
    nextBtn.addEventListener("click", () => {
      next();
      play();
    });

  prevBtn &&
    prevBtn.addEventListener("click", () => {
      prev();
      play();
    });

  if (dotsWrap) {
    dotsWrap.addEventListener("click", (e) => {
      const idx = dots.indexOf(e.target);
      if (idx > -1) {
        show(idx);
        play();
      }
    });
  }
}

/* ========== SKI GAME ========== */

class SkiGame {
  constructor(canvasId, scoreId, statusId, startBtnId, restartBtnId) {
    this.canvas = qs(`#${canvasId}`);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    this.scoreElement = qs(`#${scoreId}`);
    this.statusElement = qs(`#${statusId}`);
    this.startBtn = qs(`#${startBtnId}`);
    this.restartBtn = qs(`#${restartBtnId}`);

    this.config = {
      splashSrc: "./assets/favicon/favicon.png",
      playerSrc: "./assets/img/skier-back.png",
      lives: 3,
      baseSpeed: 2.2,
      maxSpeed: 10,
      accelPerMs: 0.00023,
      hitCooldownMs: 900,
      spawnIntervalBase: 520,
    };

    this.isRunning = false;

    this.score = 0;
    this.distance = 0;
    this.elapsedMs = 0;

    this.speed = this.config.baseSpeed;
    this.lives = this.config.lives;

    this.player = { x: 0, y: 0, width: 26, height: 42 };
    this.pointerX = 0;

    this.obstacles = [];
    this.checkpoints = [];
    this.particles = [];

    this.spawnCooldown = 0;

    this._raf = null;
    this._lastHitAt = 0;
    this._hurt = 0;

    this.assets = {
      splash: { img: null, loaded: false },
      player: { img: null, loaded: false },
    };

    this.updateCanvasSize();
    this.resetPlayer();
    this.setupEventListeners();
    this.loadAssets();
    this.renderIdle();
    this.updateUI();
  }

  loadAssets() {
    this.assets.splash.img = new Image();
    this.assets.splash.img.onload = () => {
      this.assets.splash.loaded = true;
      if (!this.isRunning) this.renderIdle();
    };
    this.assets.splash.img.src = this.config.splashSrc;

    this.assets.player.img = new Image();
    this.assets.player.img.onload = () => {
      this.assets.player.loaded = true;
    };
    this.assets.player.img.src = this.config.playerSrc;
  }

  updateCanvasSize() {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resetPlayer() {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.player.x = rect.width / 2;
    this.player.y = rect.height * 0.78;
    this.pointerX = this.player.x;
  }

  setupEventListeners() {
    if (this.startBtn) this.startBtn.addEventListener("click", () => this.start());
    if (this.restartBtn) this.restartBtn.addEventListener("click", () => this.start());

    if (this.canvas) {
      this.canvas.addEventListener("mousemove", (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = e.clientX - rect.left;
      });

      this.canvas.addEventListener(
        "touchmove",
        (e) => {
          e.preventDefault();
          const rect = this.canvas.getBoundingClientRect();
          this.pointerX = e.touches[0].clientX - rect.left;
        },
        { passive: false }
      );
    }

    window.addEventListener(
      "resize",
      debounce(() => {
        this.updateCanvasSize();
        this.resetPlayer();
        if (!this.isRunning) this.renderIdle();
      }, 220)
    );
  }

  start() {
    if (!this.canvas || !this.ctx) return;

    this.isRunning = true;

    this.score = 0;
    this.distance = 0;
    this.elapsedMs = 0;

    this.speed = this.config.baseSpeed;
    this.lives = this.config.lives;

    this.obstacles = [];
    this.checkpoints = [];
    this.particles = [];

    this.spawnCooldown = 0;

    this._lastHitAt = 0;
    this._hurt = 0;

    this.resetPlayer();

    if (this.startBtn) {
      this.startBtn.textContent = "Игра запущена...";
      this.startBtn.disabled = true;
    }

    if (this.statusElement) {
      this.statusElement.textContent =
        "Ведите мышью/пальцем по горизонтали. Скорость растёт со временем. Столкновение отнимает жизни.";
    }

    this.loop(performance.now());
  }

  stop(message) {
    this.isRunning = false;

    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;

    if (this.startBtn) {
      this.startBtn.textContent = "Начать игру";
      this.startBtn.disabled = false;
    }

    if (this.statusElement) {
      this.statusElement.textContent =
        message || `Игра окончена! Итог: ${Math.max(0, Math.floor(this.score))}`;
    }

    this.renderIdle();
  }

  updateSpeed(dt) {
    this.elapsedMs += dt;
    const next = this.config.baseSpeed + this.elapsedMs * this.config.accelPerMs;
    this.speed = Math.min(this.config.maxSpeed, next);
  }

  canTakeHit(now) {
    return now - this._lastHitAt >= this.config.hitCooldownMs;
  }

  onHit(now) {
    this._lastHitAt = now;
    this._hurt = 1;

    this.lives -= 1;

    if (this.statusElement) {
      this.statusElement.textContent = `Столкновение! Осталось жизней: ${this.lives}`;
    }

    if (this.lives <= 0) {
      this.stop(`Game Over. Итог: ${Math.max(0, Math.floor(this.score))}`);
    }
  }

  spawnObjects(dt) {
    this.spawnCooldown -= dt;
    if (this.spawnCooldown > 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.spawnCooldown = Math.max(
      240,
      this.config.spawnIntervalBase - this.speed * 32
    );

    const ox = Math.random() * (w - 40) + 20;
    this.obstacles.push({ x: ox, y: -30, width: 30, height: 30 });

    if (Math.random() < 0.33) {
      const cx = Math.random() * (w - 120) + 60;
      this.checkpoints.push({
        x: cx,
        y: -40,
        width: 90,
        height: 40,
        collected: false,
      });
    }

    if (Math.random() < 0.25) this.createSnow(w / 2, h * 0.3);
  }

  update(dt, now) {
    if (!this.isRunning) return;

    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.updateSpeed(dt);

    this.distance += this.speed * dt * 0.06;
    this.score += this.speed * dt * 0.012;

    const targetX = this.pointerX;
    this.player.x += (targetX - this.player.x) * 0.12;
    this.player.x = clamp(
      this.player.x,
      this.player.width / 2,
      w - this.player.width / 2
    );

    const dy = this.speed * dt * 0.06;

    this.obstacles = this.obstacles.filter((o) => {
      o.y += dy;

      if (this.rectsIntersect(this.player, o)) {
        this.createExplosion(o.x + o.width / 2, o.y + o.height / 2);

        if (this.canTakeHit(now)) this.onHit(now);

        return false;
      }

      return o.y < h + 50;
    });

    this.checkpoints = this.checkpoints.filter((c) => {
      c.y += dy;

      if (!c.collected && this.checkpointHit(this.player, c)) {
        c.collected = true;
        this.score += 70;
        this.createSparks(c.x + c.width / 2, c.y + c.height / 2);
      }

      return c.y < h + 70;
    });

    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 1;
      return p.life > 0;
    });

    this._hurt = Math.max(0, this._hurt - dt / 220);
  }

  rectsIntersect(player, obj) {
    const px = player.x - player.width / 2;
    const py = player.y;

    return (
      px < obj.x + obj.width &&
      px + player.width > obj.x &&
      py < obj.y + obj.height &&
      py + player.height > obj.y
    );
  }

  checkpointHit(player, cp) {
    const centerX = player.x;
    const py = player.y;

    return (
      centerX > cp.x &&
      centerX < cp.x + cp.width &&
      py < cp.y + cp.height &&
      py + player.height > cp.y
    );
  }

  createExplosion(x, y) {
    for (let i = 0; i < 10; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.8) * 4.2,
        life: 22,
        color: "#ff6b6b",
      });
    }
  }

  createSparks(x, y) {
    for (let i = 0; i < 14; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6.2,
        vy: (Math.random() - 0.8) * 5.4,
        life: 18,
        color: "#00d4ff",
      });
    }
  }

  createSnow(x, y) {
    for (let i = 0; i < 8; i += 1) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.2) * 1.2,
        life: 26,
        color: "rgba(255,255,255,0.65)",
      });
    }
  }

  drawBackground(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#87ceeb");
    g.addColorStop(1, "#e0f6ff");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    for (let i = 0; i < 18; i += 1) {
      const sx =
        (Math.sin((i + 1) * 12.9898 + this.distance * 0.01) * w + w) % w;
      const sy = ((i * h) / 18 + this.distance * 0.18) % h;

      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawImageContain(ctx, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;

    const s = Math.min(w / iw, h / ih);
    const dw = iw * s;
    const dh = ih * s;

    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  updatePlayerSize(w, h) {
    const desiredH = clamp(h * 0.09, 44, 70);

    if (this.assets.player.loaded) {
      const img = this.assets.player.img;
      const iw = img.naturalWidth || img.width || 1;
      const ih = img.naturalHeight || img.height || 1;
      const ratio = iw / ih;

      this.player.height = desiredH;
      this.player.width = Math.max(18, desiredH * ratio);
      return;
    }

    this.player.height = desiredH;
    this.player.width = Math.max(18, desiredH * 0.62);
  }

  drawPlayer(ctx) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.updatePlayerSize(w, h);

    const x = this.player.x - this.player.width / 2;
    const y = this.player.y;

    if (this.assets.player.loaded) {
      ctx.drawImage(this.assets.player.img, x, y, this.player.width, this.player.height);
      return;
    }

    ctx.fillStyle = "#ff006e";
    ctx.fillRect(x, y, this.player.width, this.player.height);
  }

  drawHUD(ctx) {
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";

    ctx.fillText(`Скорость: ${Math.round(this.speed * 8)} км/ч`, 10, 20);
    ctx.fillText(`Дистанция: ${Math.round(this.distance)} м`, 10, 36);
    ctx.fillText(`Жизни: ${this.lives}`, 10, 52);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.drawBackground(ctx, w, h);

    this.checkpoints.forEach((cp) => {
      ctx.strokeStyle = cp.collected ? "#00d400" : "#ff6b6b";
      ctx.lineWidth = 3;
      ctx.strokeRect(cp.x, cp.y, cp.width, cp.height);

      ctx.fillStyle = "rgba(255, 107, 107, 0.10)";
      ctx.fillRect(cp.x, cp.y, cp.width, cp.height);
    });

    this.obstacles.forEach((o) => {
      ctx.fillStyle = "#228b22";
      ctx.beginPath();
      ctx.moveTo(o.x + o.width / 2, o.y);
      ctx.lineTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.closePath();
      ctx.fill();
    });

    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clamp(p.life / 22, 0, 1);
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    });

    this.drawPlayer(ctx);
    this.drawHUD(ctx);

    if (this._hurt > 0) {
      ctx.fillStyle = `rgba(255, 0, 90, ${0.16 * this._hurt})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderIdle() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.drawBackground(ctx, w, h);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, w, h);

    if (this.assets.splash.loaded) {
      const boxW = Math.min(220, w * 0.42);
      const boxH = Math.min(220, h * 0.42);

      this.drawImageContain(
        ctx,
        this.assets.splash.img,
        (w - boxW) / 2,
        (h - boxH) / 2,
        boxW,
        boxH
      );
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "center";
    ctx.font = "700 16px Montserrat, system-ui, sans-serif";
    ctx.fillText("Нажмите «Начать игру»", w / 2, h * 0.78);
  }

  updateUI() {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Очки: ${Math.max(0, Math.floor(this.score))} • Жизни: ${this.lives}`;
    }
  }

  loop(prevTs) {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min(60, now - prevTs);

    this.spawnObjects(dt);
    this.update(dt, now);
    this.draw();
    this.updateUI();

    this._raf = requestAnimationFrame(() => this.loop(now));
  }
}

function initSkiGame() {
  const canvas = qs("#gameCanvas");
  if (!canvas) return;

  new SkiGame("gameCanvas", "gameScore", "gameStatus", "gameStart", "gameRestart");
}


