/* ============================================
   PORTFOLIO SCRIPT — Juan Gomez Vara
   ============================================ */

(() => {
  'use strict';

  // ============================================
  // INTERACTIVE DOT GRID
  // Ported from the original Framer component:
  // dots scatter randomly inside distortionRadius,
  // lerp back to origin when cursor leaves.
  // ============================================
  class DotGrid {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');
      this.dots   = [];
      this.mouse  = { x: -1e4, y: -1e4 };
      this.needsUpdate = true;
      this.raf = null;

      this.cfg = {
        dotSize           : 1.5,  // dot radius = dotSize / 2
        dotSpacing        : 22,   // px between dots
        distortionRadius  : 110,  // influence radius
        distortionStrength: 32,   // max random scatter px
        animationSpeed    : 0.055, // lower = silkier motion
      };

      this._onResize = this._resize.bind(this);
      this._onMove   = this._onMouseMove.bind(this);
      this._onLeave  = this._onMouseLeave.bind(this);
      this._init();
    }

    _init() {
      this._resize();
      const ro = new ResizeObserver(() => this._resize());
      ro.observe(this.canvas.parentElement);
      this.canvas.parentElement.addEventListener('mousemove',  this._onMove);
      this.canvas.parentElement.addEventListener('mouseleave', this._onLeave);
      this._tick();
    }

    _resize() {
      const el = this.canvas.parentElement;
      this.canvas.width  = el.offsetWidth;
      this.canvas.height = el.offsetHeight;
      this._buildDots(this.canvas.width, this.canvas.height);
      this.needsUpdate = true;
    }

    _buildDots(w, h) {
      const { dotSpacing } = this.cfg;
      const cols = Math.ceil(w / dotSpacing);
      const rows = Math.ceil(h / dotSpacing);
      this.dots = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * dotSpacing + dotSpacing / 2;
          const y = row * dotSpacing + dotSpacing / 2;
          this.dots.push({
            originalX: x, originalY: y,
            currentX:  x, currentY:  y,
            randomOffsetX: 0, randomOffsetY: 0,
            isRandomized: false,
            col, row,
          });
        }
      }
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.needsUpdate = true;
    }

    _onMouseLeave() {
      this.mouse.x = -1e4;
      this.mouse.y = -1e4;
      this.needsUpdate = true;
    }

    _tick() {
      if (this.needsUpdate) {
        this._draw();
      }
      this.raf = requestAnimationFrame(() => this._tick());
    }

    _draw() {
      const { ctx, canvas, dots, cfg, mouse } = this;
      const { dotSpacing, dotSize, distortionRadius, distortionStrength, animationSpeed } = cfg;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      // Idle dots — clearly visible but not overwhelming
      const idleColor    = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.28)';
      // Scattered dots — full brightness so the effect pops
      const activeColor  = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.80)';

      const mouseCol   = Math.floor(mouse.x / dotSpacing);
      const mouseRow   = Math.floor(mouse.y / dotSpacing);
      const checkRange = Math.ceil(distortionRadius / dotSpacing) + 1;

      // Two separate paths: idle and active (different opacity)
      const idlePath   = new Path2D();
      const activePath = new Path2D();
      let hasMoving = false;

      for (const dot of dots) {
        let targetX = dot.originalX;
        let targetY = dot.originalY;
        let isActive = false;

        const nearMouse =
          Math.abs(dot.col - mouseCol) <= checkRange &&
          Math.abs(dot.row - mouseRow) <= checkRange;

        if (nearMouse) {
          const dx = mouse.x - dot.originalX;
          const dy = mouse.y - dot.originalY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < distortionRadius) {
            if (!dot.isRandomized) {
              dot.randomOffsetX = (Math.random() - 0.5) * distortionStrength * 2;
              dot.randomOffsetY = (Math.random() - 0.5) * distortionStrength * 2;
              dot.isRandomized  = true;
            }
            targetX  = dot.originalX + dot.randomOffsetX;
            targetY  = dot.originalY + dot.randomOffsetY;
            isActive = true;
          } else {
            dot.isRandomized = false;
          }
        } else {
          dot.isRandomized = false;
        }

        dot.currentX += (targetX - dot.currentX) * animationSpeed;
        dot.currentY += (targetY - dot.currentY) * animationSpeed;

        // A displaced dot stays "active" until it nearly returns
        const displaced = Math.hypot(dot.currentX - dot.originalX, dot.currentY - dot.originalY);
        if (displaced > 0.5) isActive = true;

        if (Math.abs(dot.currentX - targetX) > 0.08 || Math.abs(dot.currentY - targetY) > 0.08) {
          hasMoving = true;
        }

        const r    = dotSize / 2;
        const path = isActive ? activePath : idlePath;
        path.moveTo(dot.currentX + r, dot.currentY);
        path.arc(dot.currentX, dot.currentY, r, 0, Math.PI * 2);
      }

      ctx.fillStyle = idleColor;
      ctx.fill(idlePath);
      ctx.fillStyle = activeColor;
      ctx.fill(activePath);

      this.needsUpdate = hasMoving;
    }
  }

  // Boot the dot grid
  const dotCanvas = document.getElementById('dotGrid');
  if (dotCanvas) new DotGrid(dotCanvas);

  // ============================================
  // THEME TOGGLE
  // ============================================
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
  });

  // ============================================
  // CUSTOM CURSOR
  // ============================================
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let mx = -100, my = -100;
  let fx = -100, fy = -100;

  if (cursor && follower) {
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    });

    // Smooth follower
    const animateFollower = () => {
      fx += (mx - fx) * 0.12;
      fy += (my - fy) * 0.12;
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();
  }

  // ============================================
  // MAGNETIC BUTTONS
  // ============================================
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });

  // ============================================
  // SCROLL ANIMATIONS (IntersectionObserver)
  // ============================================
  const animatables = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => {
        el.classList.add('animated');
      }, delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  animatables.forEach(el => observer.observe(el));

  // Hero animates immediately on load
  window.addEventListener('load', () => {
    document.querySelectorAll('.hero [data-animate]').forEach(el => {
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('animated'), delay + 100);
    });

    // Page header on projects page
    document.querySelectorAll('.page-header [data-animate]').forEach(el => {
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('animated'), delay + 100);
    });
  });

  // ============================================
  // NAV — scroll behavior
  // ============================================
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 80) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
    lastScroll = current;
  }, { passive: true });

  // ============================================
  // PROJECT CURSOR PREVIEW (projects page)
  // ============================================
  const preview = document.getElementById('projectPreview');
  const previewImg = document.getElementById('projectPreviewImg');

  if (preview && previewImg) {
    let px = 0, py = 0;
    let targetX = 0, targetY = 0;
    let isActive = false;

    const movePreview = () => {
      if (!isActive) return;
      px += (targetX - px) * 0.1;
      py += (targetY - py) * 0.1;
      preview.style.left = px + 'px';
      preview.style.top = py + 'px';
      requestAnimationFrame(movePreview);
    };

    document.querySelectorAll('.project-row').forEach(row => {
      row.addEventListener('mouseenter', (e) => {
        const bg = row.dataset.previewBg;
        const text = row.dataset.previewText;
        previewImg.style.background = bg;
        previewImg.textContent = text;
        preview.classList.add('active');
        isActive = true;
        movePreview();
      });

      row.addEventListener('mousemove', (e) => {
        targetX = e.clientX + 24;
        targetY = e.clientY - preview.offsetHeight / 2;
        // Keep in viewport
        const maxX = window.innerWidth - preview.offsetWidth - 20;
        const maxY = window.innerHeight - preview.offsetHeight - 20;
        targetX = Math.min(targetX, maxX);
        targetY = Math.max(20, Math.min(targetY, maxY));
      });

      row.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
        isActive = false;
      });
    });
  }

  // ============================================
  // SMOOTH PAGE TRANSITIONS
  // ============================================
  const transition = document.createElement('div');
  transition.className = 'page-transition';
  document.body.appendChild(transition);

  // Entrance animation
  setTimeout(() => { transition.classList.add('exit'); }, 100);

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only intercept local page links
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      transition.classList.remove('exit');
      transition.classList.add('enter');
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    });
  });

  // ============================================
  // PARALLAX ON HERO BLOBS
  // ============================================
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length) {
    document.addEventListener('mousemove', (e) => {
      const px = (e.clientX / window.innerWidth - 0.5) * 2;
      const py = (e.clientY / window.innerHeight - 0.5) * 2;
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 12;
        blob.style.transform = `translate(${px * factor}px, ${py * factor}px)`;
      });
    }, { passive: true });
  }

  // ============================================
  // FOOTER GRAPHIC — parallax scroll
  // ============================================
  const footerGraphic = document.querySelector('.footer-graphic');
  if (footerGraphic) {
    window.addEventListener('scroll', () => {
      const rect = footerGraphic.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        const progress = 1 - rect.top / window.innerHeight;
        footerGraphic.style.transform = `translateX(${progress * -60}px)`;
      }
    }, { passive: true });
  }

  // ============================================
  // STAGGER GRID ITEMS
  // ============================================
  document.querySelectorAll('.projects-grid .project-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 80}ms`;
  });

  // ============================================
  // FOOTER DOT GRID — dots form the JGV graphic element
  //
  // The JGV symbol is a 6-armed asterisk that exactly
  // matches JGV-graficElememt.svg:
  //   • A central filled circle
  //   • 6 pill-shaped arms at 60° intervals
  //     (vertical axis + two diagonal axes at ±30° from horiz.)
  //   • Each arm starts with a GAP from the circle edge
  //
  // On hover, nearby dots are pulled toward the nearest
  // arm segment or the central circle, materialising the
  // JGV symbol centered on the cursor in real time.
  // ============================================
  class FooterDotGrid {
    constructor(canvas) {
      this.canvas  = canvas;
      this.ctx     = canvas.getContext('2d');
      this.dots    = [];
      this.mouse   = { x: -1e4, y: -1e4 };
      this.needsUpdate = true;

      // Proportions derived from the SVG (125×137 viewBox):
      //   center circle r ≈ 9.1 / 62.5 half-width → ~14.6% of half-width
      //   inner gap      ≈ 28.8 / 62.5             → ~46% of half-width
      //   arm length     ≈ 22.6 / 62.5             → ~36% of half-width
      // Scaled to a ~240px diameter pattern:
      this.cfg = {
        dotSize       : 1.5,
        dotSpacing    : 24,
        patternRadius : 190,   // outer influence halo
        centerRadius  : 28,    // central circle attractor radius
        innerGap      : 55,    // gap from cursor centre to arm start
        armLength     : 58,    // length of each arm capsule
        armWidth      : 22,    // half-width of arm attraction corridor
        speed         : 0.065, // lerp factor
      };

      // 6 arm directions — standard canvas convention:
      //   x: cos(angle), y: sin(angle)  (y increases downward)
      const H = Math.PI / 6; // 30°
      this.armAngles = [
        -Math.PI / 2,   // ↑  straight up
         Math.PI / 2,   // ↓  straight down
        -H,             // ↗  upper-right  (−30°)
         H,             // ↘  lower-right  (+30°)
         Math.PI - H,   // ↙  lower-left  (150°)
        -Math.PI + H,   // ↖  upper-left  (−150°/210°)
      ];

      this._init();
    }

    _init() {
      this._resize();
      new ResizeObserver(() => this._resize()).observe(this.canvas.parentElement);
      const footer = this.canvas.parentElement;
      footer.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.needsUpdate = true;
      });
      footer.addEventListener('mouseleave', () => {
        this.mouse.x = -1e4;
        this.mouse.y = -1e4;
        this.needsUpdate = true;
      });
      this._tick();
    }

    _resize() {
      const el = this.canvas.parentElement;
      this.canvas.width  = el.offsetWidth;
      this.canvas.height = el.offsetHeight;
      this._build();
      this.needsUpdate = true;
    }

    _build() {
      const { dotSpacing } = this.cfg;
      const cols = Math.ceil(this.canvas.width  / dotSpacing) + 1;
      const rows = Math.ceil(this.canvas.height / dotSpacing) + 1;
      this.dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing + dotSpacing / 2;
          const y = r * dotSpacing + dotSpacing / 2;
          this.dots.push({ ox: x, oy: y, x, y });
        }
      }
    }

    _tick() {
      if (this.needsUpdate) this._drawFrame();
      requestAnimationFrame(() => this._tick());
    }

    _drawFrame() {
      const { ctx, canvas, dots, cfg, armAngles } = this;
      const { patternRadius, centerRadius, innerGap, armLength, armWidth, speed, dotSize } = cfg;
      const mx = this.mouse.x, my = this.mouse.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const idleAlpha   = isDark ? 0.18 : 0.12;
      const activeAlpha = isDark ? 0.92 : 0.78;

      const idlePath   = new Path2D();
      const activePath = new Path2D();
      let   hasMoving  = false;

      for (const dot of dots) {
        const distToCenter = Math.hypot(dot.ox - mx, dot.oy - my);

        let targetX = dot.ox;
        let targetY = dot.oy;
        let isActive = false;

        if (distToCenter < patternRadius) {
          const zoneFalloff = 1 - distToCenter / patternRadius;
          let bestBlend = 0;
          let bestX = dot.ox, bestY = dot.oy;

          // ── Central circle ──────────────────────────────────
          if (distToCenter < centerRadius) {
            const cBlend = Math.pow(1 - distToCenter / centerRadius, 0.5) * 0.96;
            if (cBlend > bestBlend) {
              bestBlend = cBlend;
              bestX = mx;
              bestY = my;
            }
          }

          // ── 6 arm segments ───────────────────────────────────
          // Each arm starts at innerGap from cursor, extends armLength further
          for (const angle of armAngles) {
            const ax1 = mx + Math.cos(angle) * innerGap;
            const ay1 = my + Math.sin(angle) * innerGap;
            const ax2 = mx + Math.cos(angle) * (innerGap + armLength);
            const ay2 = my + Math.sin(angle) * (innerGap + armLength);

            // Project dot origin onto the arm segment
            const sdx = ax2 - ax1, sdy = ay2 - ay1;
            const len2 = sdx * sdx + sdy * sdy;
            const t = Math.max(0, Math.min(1,
              ((dot.ox - ax1) * sdx + (dot.oy - ay1) * sdy) / len2
            ));
            const projX = ax1 + t * sdx;
            const projY = ay1 + t * sdy;
            const perpDist = Math.hypot(dot.ox - projX, dot.oy - projY);

            if (perpDist < armWidth) {
              // Sharp centre-line, soft outer edge — gives a pill/capsule feel
              const edgeFade = Math.pow(1 - perpDist / armWidth, 2.2);
              const blend    = edgeFade * Math.pow(zoneFalloff, 0.35);
              if (blend > bestBlend) {
                bestBlend = blend;
                bestX = projX;
                bestY = projY;
              }
            }
          }

          if (bestBlend > 0.012) {
            targetX  = dot.ox + (bestX - dot.ox) * bestBlend;
            targetY  = dot.oy + (bestY - dot.oy) * bestBlend;
            isActive = bestBlend > 0.16;
          }
        }

        dot.x += (targetX - dot.x) * speed;
        dot.y += (targetY - dot.y) * speed;

        if (Math.abs(dot.x - targetX) > 0.06 || Math.abs(dot.y - targetY) > 0.06) hasMoving = true;
        if (Math.hypot(dot.x - dot.ox, dot.y - dot.oy) > 1.2) isActive = true;

        const r = dotSize / 2;
        const path = isActive ? activePath : idlePath;
        path.moveTo(dot.x + r, dot.y);
        path.arc(dot.x, dot.y, r, 0, Math.PI * 2);
      }

      const [R, G, B] = isDark ? [255, 255, 255] : [6, 15, 32];
      ctx.fillStyle = `rgba(${R},${G},${B},${idleAlpha})`;
      ctx.fill(idlePath);
      ctx.fillStyle = `rgba(${R},${G},${B},${activeAlpha})`;
      ctx.fill(activePath);

      this.needsUpdate = hasMoving;
    }
  }

  // Boot footer dot grid
  const footerCanvas = document.getElementById('footerDotGrid');
  if (footerCanvas) new FooterDotGrid(footerCanvas);

})();
