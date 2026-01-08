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
        setTimeout(() => { inThrottle = false; }, limit);
    };
};

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const lockScroll = (locked) => {
    document.documentElement.style.overflow = locked ? 'hidden' : '';
    document.body.style.overflow = locked ? 'hidden' : '';
};

document.addEventListener('DOMContentLoaded', () => {
    // ================================
    // SCROLL PROGRESS
    // ================================
    const scrollProgress = qs('.scroll-progress');

    const updateScrollProgress = throttle(() => {
        if (!scrollProgress) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
        scrollProgress.style.transform = `scaleX(${scrollPercent})`;
    }, 50);

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // ================================
    // MOBILE NAV
    // ================================
    const navToggle = qs('.nav-toggle');
    const mobileNav = qs('#mobileNav');

    const setMobileNavState = (open) => {
        if (!navToggle || !mobileNav) return;
        navToggle.classList.toggle('active', open);
        mobileNav.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        lockScroll(open);
    };

    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = mobileNav.classList.contains('active');
            setMobileNavState(!isOpen);
        });

        qsa('a', mobileNav).forEach((link) => {
            link.addEventListener('click', () => setMobileNavState(false));
        });

        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 767) setMobileNavState(false);
        }, 250));
    }

    // ================================
    // SIDEBAR ACTIVE CHAPTER
    // ================================
    const contentsLinks = qsa('.contents a[data-chapter]');
    const chapters = qsa('.chapter');

    const highlightActiveChapter = throttle(() => {
        if (!chapters.length || !contentsLinks.length) return;

        let activeChapter = chapters[0];

        chapters.forEach((chapter) => {
            const rect = chapter.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.35) activeChapter = chapter;
        });

        contentsLinks.forEach((link) => link.classList.remove('active'));

        const num = (activeChapter.id || '').split('-')[1];
        const activeLink = qs(`.contents a[data-chapter="${num}"]`);
        if (activeLink) activeLink.classList.add('active');
    }, 100);

    window.addEventListener('scroll', highlightActiveChapter, { passive: true });
    highlightActiveChapter();

    // ================================
    // INTERSECTION OBSERVER (chapters reveal)
    // ================================
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        chapters.forEach((chapter) => observer.observe(chapter));
    } else {
        chapters.forEach((chapter) => chapter.classList.add('visible'));
    }

    // ================================
    // MODALS
    // ================================
    const skiPassModal = qs('#skiPassModal');
    const planModal = qs('#planModal');
    const btnSkiPass = qs('#btnSkiPass');
    const btnPlan = qs('#btnPlan');

    let activeModal = null;

    const openModal = (modal) => {
        if (!modal) return;
        activeModal = modal;
        modal.hidden = false;
        lockScroll(true);
        modal.focus();
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.hidden = true;
        lockScroll(false);
        if (activeModal === modal) activeModal = null;
    };

    const bindModal = (modal) => {
        if (!modal) return;

        const closeBtn = qs('.modal-close', modal);
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    };

    bindModal(skiPassModal);
    bindModal(planModal);

    if (btnSkiPass) btnSkiPass.addEventListener('click', () => openModal(skiPassModal));
    if (btnPlan) btnPlan.addEventListener('click', () => openModal(planModal));

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (activeModal && !activeModal.hidden) closeModal(activeModal);
        if (mobileNav && mobileNav.classList.contains('active')) setMobileNavState(false);
    });

    const planForm = qs('#planForm');
    if (planForm) {
        planForm.addEventListener('submit', (e) => {
            e.preventDefault();
            closeModal(planModal);
        });
    }

    // ================================
    // GALLERY & LIGHTBOX
    // ================================
    const galleryItems = qsa('.gallery-item picture');
    const lightbox = qs('#lightbox');
    const lightboxImage = qs('#lightboxImage');
    const lightboxClose = qs('.lightbox-close');
    const lightboxPrev = qs('.lightbox-prev');
    const lightboxNext = qs('.lightbox-next');

    const galleryImages = [
        { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Панорама долины' },
        { src: 'https://images.unsplash.com/photo-1455849318743-b2233fc3d430?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Сноубордист' },
        { src: 'https://images.unsplash.com/photo-1516937379896-c2e6b43c6ba0?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Экстремальный спуск' },
        { src: 'https://images.unsplash.com/photo-1486432690881-cd92bb73b0dd?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Подъём на вершину' },
        { src: 'https://images.unsplash.com/photo-1536999090869-2372b56a3658?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Обучение катанию' },
        { src: 'https://images.unsplash.com/photo-1514432324607-2e467f4af3fb?auto=format&fit=crop&w=1200&h=800&q=80', alt: 'Апре-ски в баре' }
    ];

    let currentGalleryIndex = 0;

    const openLightbox = (index) => {
        if (!lightbox || !lightboxImage) return;
        currentGalleryIndex = index;
        lightboxImage.src = galleryImages[index].src;
        lightboxImage.alt = galleryImages[index].alt;
        lightbox.hidden = false;
        lockScroll(true);
    };

    const closeLightbox = () => {
        if (!lightbox) return;
        lightbox.hidden = true;
        lockScroll(false);
    };

    const showNextImage = () => {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
        if (lightboxImage) {
            lightboxImage.src = galleryImages[currentGalleryIndex].src;
            lightboxImage.alt = galleryImages[currentGalleryIndex].alt;
        }
    };

    const showPrevImage = () => {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
        if (lightboxImage) {
            lightboxImage.src = galleryImages[currentGalleryIndex].src;
            lightboxImage.alt = galleryImages[currentGalleryIndex].alt;
        }
    };

    galleryItems.forEach((item, index) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openLightbox(index));
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);
    if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox || lightbox.hidden) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextImage();
            if (e.key === 'ArrowLeft') showPrevImage();
        });

        let touchStartX = 0;
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            if (touchStartX - touchEndX > 50) showNextImage();
            if (touchEndX - touchStartX > 50) showPrevImage();
        });
    }

    // ================================
    // FAQ ACCORDION
    // ================================
    const faqItems = qsa('.faq-item');

    faqItems.forEach((item) => {
        const question = qs('.faq-question', item);
        const answer = qs('.faq-answer', item);
        if (!question || !answer) return;

        question.addEventListener('click', () => {
            const isOpen = question.getAttribute('aria-expanded') === 'true';

            faqItems.forEach((otherItem) => {
                if (otherItem === item) return;
                const q = qs('.faq-question', otherItem);
                const a = qs('.faq-answer', otherItem);
                if (!q || !a) return;
                q.setAttribute('aria-expanded', 'false');
                a.hidden = true;
            });

            question.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
            answer.hidden = isOpen;
        });
    });

    // ================================
    // BACK TO TOP
    // ================================
    const backToTopBtn = qs('#backToTop');

    const toggleBackToTop = throttle(() => {
        if (!backToTopBtn) return;
        backToTopBtn.classList.toggle('visible', window.scrollY > 300);
    }, 100);

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ================================
    // SKI GAME (исправлено: настоящий canvas + адекватная логика движения)
    // ================================
    class SkiGame {
        constructor(canvasId, scoreId, statusId, startBtnId) {
            this.canvas = qs(`#${canvasId}`);
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

            this.scoreElement = qs(`#${scoreId}`);
            this.statusElement = qs(`#${statusId}`);
            this.startBtn = qs(`#${startBtnId}`);

            this.isRunning = false;
            this.score = 0;

            this.player = {
                x: 0,
                y: 0,
                width: 18,
                height: 26
            };

            this.speed = 2.2;
            this.maxSpeed = 8;
            this.distance = 0;
            this.finishDistance = 2000;

            this.obstacles = [];
            this.checkpoints = [];
            this.particles = [];

            this.pointerX = 0;

            this.spawnCooldown = 0;
            this.spawnIntervalBase = 520;

            this._raf = null;

            this.updateCanvasSize();
            this.resetPlayer();
            this.setupEventListeners();
        }

        updateCanvasSize() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();

            // Важно: canvas должен иметь реальные пиксели с учётом DPR
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));

            if (this.ctx) {
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }

        resetPlayer() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            this.player.x = rect.width / 2;
            this.player.y = rect.height * 0.78;
            this.pointerX = this.player.x;
        }

        setupEventListeners() {
            if (this.startBtn) {
                this.startBtn.addEventListener('click', () => this.start());
            }

            if (this.canvas) {
                this.canvas.addEventListener('mousemove', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    this.pointerX = e.clientX - rect.left;
                });

                this.canvas.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const rect = this.canvas.getBoundingClientRect();
                    this.pointerX = e.touches[0].clientX - rect.left;
                }, { passive: false });
            }

            window.addEventListener('resize', debounce(() => {
                this.updateCanvasSize();
                this.resetPlayer();
            }, 200));
        }

        start() {
            if (!this.canvas || !this.ctx) return;

            this.isRunning = true;
            this.score = 0;
            this.distance = 0;
            this.speed = 2.2;

            this.obstacles = [];
            this.checkpoints = [];
            this.particles = [];

            this.spawnCooldown = 0;

            this.resetPlayer();

            if (this.startBtn) {
                this.startBtn.textContent = 'Игра запущена...';
                this.startBtn.disabled = true;
            }

            if (this.statusElement) {
                this.statusElement.textContent = 'Двигайтесь по горизонтали, избегайте препятствий и собирайте ворота.';
            }

            this.loop(performance.now());
        }

        stop(message) {
            this.isRunning = false;

            if (this._raf) cancelAnimationFrame(this._raf);
            this._raf = null;

            if (this.startBtn) {
                this.startBtn.textContent = 'Начать игру';
                this.startBtn.disabled = false;
            }

            if (this.statusElement) {
                this.statusElement.textContent = message || `Игра окончена! Финальный счёт: ${Math.max(0, Math.floor(this.score))}`;
            }
        }

        spawnObjects(dt) {
            this.spawnCooldown -= dt;
            if (this.spawnCooldown > 0) return;

            const rect = this.canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            this.spawnCooldown = Math.max(240, this.spawnIntervalBase - this.speed * 30);

            // Препятствие
            const ox = Math.random() * (w - 40) + 20;
            this.obstacles.push({
                x: ox,
                y: -30,
                width: 30,
                height: 30
            });

            // Иногда ворота
            if (Math.random() < 0.33) {
                const cx = Math.random() * (w - 120) + 60;
                this.checkpoints.push({
                    x: cx,
                    y: -40,
                    width: 90,
                    height: 40,
                    collected: false
                });
            }

            // Мелкие снежинки
            if (Math.random() < 0.25) this.createSnow(w / 2, h * 0.3);
        }

        update(dt) {
            if (!this.isRunning) return;

            const rect = this.canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            // Ускорение
            this.speed = Math.min(this.maxSpeed, this.speed + dt * 0.00035);

            // Дистанция и очки
            this.distance += this.speed * dt * 0.06;
            this.score += this.speed * dt * 0.012;

            // Игрок (плавно за указателем)
            const targetX = this.pointerX;
            this.player.x += (targetX - this.player.x) * 0.12;
            this.player.x = Math.max(this.player.width / 2, Math.min(w - this.player.width / 2, this.player.x));

            // Двигаем объекты вниз
            const dy = this.speed * dt * 0.06;

            this.obstacles = this.obstacles.filter((o) => {
                o.y += dy;
                if (this.rectsIntersect(this.player, o)) {
                    this.createExplosion(o.x, o.y);
                    this.score -= 35;
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

            if (this.distance >= this.finishDistance) {
                this.score += 500;
                this.stop(`Финиш! Итог: ${Math.max(0, Math.floor(this.score))}`);
            }
        }

        rectsIntersect(player, obj) {
            const px = player.x - player.width / 2;
            const py = player.y;
            return px < obj.x + obj.width &&
                   px + player.width > obj.x &&
                   py < obj.y + obj.height &&
                   py + player.height > obj.y;
        }

        checkpointHit(player, cp) {
            const centerX = player.x;
            const py = player.y;
            return centerX > cp.x &&
                   centerX < cp.x + cp.width &&
                   py < cp.y + cp.height &&
                   py + player.height > cp.y;
        }

        createExplosion(x, y) {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 4.5,
                    vy: (Math.random() - 0.8) * 4.2,
                    life: 22,
                    color: '#ff6b6b'
                });
            }
        }

        createSparks(x, y) {
            for (let i = 0; i < 14; i++) {
                this.particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 6.2,
                    vy: (Math.random() - 0.8) * 5.4,
                    life: 18,
                    color: '#00d4ff'
                });
            }
        }

        createSnow(x, y) {
            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 80,
                    y: y + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.2) * 1.2,
                    life: 26,
                    color: 'rgba(255,255,255,0.65)'
                });
            }
        }

        drawBackground(ctx, w, h) {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, '#87ceeb');
            g.addColorStop(1, '#e0f6ff');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);

            // Лёгкая «снежная» текстура
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            for (let i = 0; i < 18; i++) {
                const sx = (Math.sin((i + 1) * 12.9898 + this.distance * 0.01) * w + w) % w;
                const sy = (i * h / 18 + this.distance * 0.18) % h;
                ctx.beginPath();
                ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        draw() {
            if (!this.ctx || !this.canvas) return;

            const ctx = this.ctx;
            const rect = this.canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            this.drawBackground(ctx, w, h);

            // Ворота
            this.checkpoints.forEach((cp) => {
                ctx.strokeStyle = cp.collected ? '#00d400' : '#ff6b6b';
                ctx.lineWidth = 3;
                ctx.strokeRect(cp.x, cp.y, cp.width, cp.height);
                ctx.fillStyle = 'rgba(255, 107, 107, 0.10)';
                ctx.fillRect(cp.x, cp.y, cp.width, cp.height);
            });

            // Деревья
            this.obstacles.forEach((o) => {
                ctx.fillStyle = '#228b22';
                ctx.beginPath();
                ctx.moveTo(o.x + o.width / 2, o.y);
                ctx.lineTo(o.x, o.y + o.height);
                ctx.lineTo(o.x + o.width, o.y + o.height);
                ctx.closePath();
                ctx.fill();
            });

            // Частицы
            this.particles.forEach((p) => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 22));
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                ctx.globalAlpha = 1;
            });

            // Игрок
            ctx.fillStyle = '#ff006e';
            ctx.fillRect(this.player.x - this.player.width / 2, this.player.y, this.player.width, this.player.height);

            // «очки»
            ctx.fillStyle = 'white';
            ctx.fillRect(this.player.x - 6, this.player.y + 6, 4, 4);
            ctx.fillRect(this.player.x + 2, this.player.y + 6, 4, 4);

            // Телеметрия
            ctx.fillStyle = '#1a1a1a';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Скорость: ${Math.round(this.speed * 8)} км/ч`, 10, 20);
            ctx.fillText(`Дистанция: ${Math.round(this.distance)} м`, 10, 36);
        }

        loop(prevTs) {
            if (!this.isRunning) return;

            const now = performance.now();
            const dt = Math.min(60, now - prevTs);

            this.spawnObjects(dt);
            this.update(dt);
            this.draw();

            if (this.scoreElement) {
                this.scoreElement.textContent = `Очки: ${Math.max(0, Math.floor(this.score))}`;
            }

            this._raf = requestAnimationFrame(() => this.loop(now));
        }
    }

    // Инициализация игры
    const game = new SkiGame('gameCanvas', 'gameScore', 'gameStatus', 'gameStart');

    // ================================
    // READY
    // ================================
    // eslint-disable-next-line no-console
    console.log('Glacier Peak website loaded and ready!');
});


   // ========== PROJECTS CAROUSEL ==========
function initProjectsCarousel() {
  const viewport = document.querySelector(".projects-viewport");
  if (!viewport) return;

  const stage = viewport.querySelector(".projects-stage");
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll(".project-card"));
  if (!cards.length) return;

  const dotsWrap = viewport.querySelector(".pr-dots");
  const prevBtn = viewport.querySelector(".prev");
  const nextBtn = viewport.querySelector(".next");
  if (!dotsWrap) return;

  let i = 0;
  let timer = null;

  const interval = +(viewport.dataset.interval || 5000);
  const autoplay = viewport.dataset.autoplay !== "false";
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  dotsWrap.innerHTML = cards.map(() => "<i></i>").join("");
  const dots = Array.from(dotsWrap.children);

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

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      next();
      play();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prev();
      play();
    });
  }

  dotsWrap.addEventListener("click", (e) => {
    const idx = dots.indexOf(e.target);
    if (idx > -1) {
      show(idx);
      play();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsCarousel);
} else {
  initProjectsCarousel();
}

