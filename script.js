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

      // Defaults — override per-canvas via data-* attributes on the <canvas>
      const d = canvas.dataset;
      this.cfg = {
        dotSize           : parseFloat(d.dotSize)            || 2.0,
        dotSpacing        : parseFloat(d.dotSpacing)         || 22,
        distortionRadius  : parseFloat(d.distortionRadius)   || 110,
        distortionStrength: parseFloat(d.distortionStrength) || 32,
        animationSpeed    : parseFloat(d.animationSpeed)     || 0.055,
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

    _tick(ts = 0) {
      const dt = Math.min(ts - (this._lastTs || ts), 50);
      this._lastTs = ts;
      this._dt = dt;
      if (this.needsUpdate) {
        this._draw();
      }
      this.raf = requestAnimationFrame((t) => this._tick(t));
    }

    _draw() {
      const { ctx, canvas, dots, cfg, mouse } = this;
      const { dotSpacing, dotSize, distortionRadius, distortionStrength, animationSpeed } = cfg;
      // Delta-time corrected lerp factor — normalises to 60 fps so the
      // animation feels identical regardless of canvas size / frame rate.
      const dtFactor = this._dt > 0 ? this._dt / 16.667 : 1;
      const lerpK = 1 - Math.pow(1 - animationSpeed, dtFactor);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const idleColor   = 'rgba(21,29,60,0.70)';
      const activeColor = 'rgba(21,29,60,1.00)';

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

        dot.currentX += (targetX - dot.currentX) * lerpK;
        dot.currentY += (targetY - dot.currentY) * lerpK;

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
  // HAMBURGER MENU
  // ============================================
  const hamburger   = document.getElementById('navHamburger');
  const mobileMenu  = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    const openMenu = () => {
      hamburger.classList.add('is-open');
      mobileMenu.classList.add('is-open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };
    const closeMenu = () => {
      hamburger.classList.remove('is-open');
      mobileMenu.classList.remove('is-open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    hamburger.addEventListener('click', () => {
      hamburger.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // Close when any mobile link is clicked
    mobileMenu.querySelectorAll('.mobile-nav-link, .btn-primary').forEach(el => {
      el.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

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
  // CURSOR-FOLLOW GRADIENT — buttons stay static,
  // a radial glow tracks the cursor inside the button.
  // Replaces all magnetic translate/transform effects.
  // ============================================
  document.querySelectorAll('.btn-primary, .btn-nav').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
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

  // Hero animates immediately on load (index .hero and case-study .cs-hero)
  window.addEventListener('load', () => {
    document.querySelectorAll('.hero [data-animate], .cs-hero [data-animate]').forEach(el => {
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
  // FOOTER DOT GRID — cursor proximity glow
  // ============================================
  // FOOTER — ANIMATED NODE CONNECTION SYSTEM
  // On hover the nearest dot becomes an active
  // node. Lines grow outward from it to nearby
  // neighbours, animated progress 0→1, with a
  // bright particle riding each line tip.
  // Connections fade after arrival. The system
  // re-pulses while the cursor rests on a node.
  // ============================================
  class FooterDotGrid {
    constructor(canvas) {
      this.canvas         = canvas;
      this.ctx            = canvas.getContext('2d');
      this.dots           = [];        // { x, y }
      this.connections    = [];        // { fromIdx, toIdx, progress, speed, alpha, complete, completeAt }
      this.activeNodeIdx  = -1;
      this.mouse          = { x: -1e4, y: -1e4 };
      this._lastEmit      = 0;
      this._lastTs        = 0;

      this.cfg = {
        dotSize        : 2.0,
        dotSpacing     : 22,
        maxConnections : 12,
        baseSpeed      : 0.025,  // slightly slower — long lines need time to travel
        holdDuration   : 480,
        fadeDuration   : 380,
        maxConnectDist : 200,    // 9 × dotSpacing — lines span up to 9 dot positions
        minConnectDist : 44,     // 2 × dotSpacing — skip immediate neighbours
        repulseInterval: 680,
      };

      this._init();
    }

    _init() {
      this._resize();
      new ResizeObserver(() => this._resize()).observe(this.canvas.parentElement);

      const footer = this.canvas.parentElement;
      footer.addEventListener('mousemove', (e) => {
        const rect   = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
      footer.addEventListener('mouseleave', () => {
        this.mouse.x       = -1e4;
        this.mouse.y       = -1e4;
        this.activeNodeIdx = -1;
        this.connections   = [];
      });

      requestAnimationFrame((t) => this._tick(t));
    }

    _resize() {
      const el = this.canvas.parentElement;
      this.canvas.width  = el.offsetWidth;
      this.canvas.height = el.offsetHeight;
      this._build();
    }

    _build() {
      const { dotSpacing } = this.cfg;
      const cols = Math.ceil(this.canvas.width  / dotSpacing) + 1;
      const rows = Math.ceil(this.canvas.height / dotSpacing) + 1;
      this.dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          this.dots.push({
            x: c * dotSpacing + dotSpacing / 2,
            y: r * dotSpacing + dotSpacing / 2,
          });
        }
      }
      this.activeNodeIdx = -1;
      this.connections   = [];
    }

    // ── Snap to nearest dot (always returns closest when inside) ──
    _nearestDot() {
      if (this.mouse.x < -9999) return -1;
      let best = 0, bestD2 = Infinity;
      for (let i = 0; i < this.dots.length; i++) {
        const dx = this.dots[i].x - this.mouse.x;
        const dy = this.dots[i].y - this.mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) { bestD2 = d2; best = i; }
      }
      return best;
    }

    // ── Sector-based neighbour selection ──
    // Divides 360° into maxConnections sectors.  Immediate neighbours
    // (< minConnectDist) are skipped so every line jumps at least 2 dot
    // positions.  From each sector a dot is chosen at random from ALL
    // eligible candidates — not just the closest — so connections span
    // the full 6–9 dot range rather than clustering near the origin.
    _getNeighbors(fromIdx) {
      const { maxConnectDist, minConnectDist, maxConnections } = this.cfg;
      const from  = this.dots[fromIdx];
      const minD2 = minConnectDist * minConnectDist;
      const maxD2 = maxConnectDist * maxConnectDist;
      const n     = maxConnections;

      // Collect candidates in the valid distance band
      const candidates = [];
      for (let i = 0; i < this.dots.length; i++) {
        if (i === fromIdx) continue;
        const dx = this.dots[i].x - from.x;
        const dy = this.dots[i].y - from.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD2 && d2 < maxD2) {
          candidates.push({ idx: i, d2, angle: Math.atan2(dy, dx) });
        }
      }

      // One random pick per angular sector → long, organic spread
      const sectorSize = (Math.PI * 2) / n;
      const selected   = new Set();

      for (let s = 0; s < n; s++) {
        const sMin     = -Math.PI + s * sectorSize;
        const sMax     = sMin + sectorSize;
        const inSector = candidates.filter(c => c.angle >= sMin && c.angle < sMax);
        if (inSector.length === 0) continue;
        // Random from the full eligible set — avoids always picking the nearest dot
        selected.add(inSector[Math.floor(Math.random() * inSector.length)].idx);
      }

      return [...selected];
    }

    // ── Create a new batch of connections from fromIdx ──
    _emit(fromIdx, ts) {
      const from      = this.dots[fromIdx];
      const neighbors = this._getNeighbors(fromIdx);

      for (const toIdx of neighbors) {
        const to   = this.dots[toIdx];
        const dx   = to.x - from.x;
        const dy   = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Slightly randomise speed — closer = faster, adds organic variety
        const proximity = 1 - dist / this.cfg.maxConnectDist;
        const speed     = this.cfg.baseSpeed * (0.75 + proximity * 0.5 + Math.random() * 0.35);

        // Perpendicular bezier offset — gives each line an organic bend.
        // Sign is random; magnitude is 6–20% of the line's own length.
        const curveSide = Math.random() < 0.5 ? 1 : -1;
        const curve     = curveSide * (0.06 + Math.random() * 0.14) * dist;

        this.connections.push({
          fromIdx,
          toIdx,
          progress  : 0,
          speed,
          alpha     : 1,
          complete  : false,
          completeAt: -1,
          curve,          // stored per-connection, consistent across frames
        });
      }
      this._lastEmit = ts;
    }

    _tick(ts = 0) {
      const dt       = Math.min(ts - (this._lastTs || ts), 50);
      this._lastTs   = ts;
      const dtFactor = dt > 0 ? dt / 16.667 : 1;

      // ── Active node detection ──
      const nearIdx = this._nearestDot();

      if (nearIdx !== this.activeNodeIdx) {
        // Cursor jumped to a new node → reset and fire
        this.activeNodeIdx = nearIdx;
        this.connections   = [];
        if (nearIdx !== -1) this._emit(nearIdx, ts);
      } else if (nearIdx !== -1 && ts - this._lastEmit > this.cfg.repulseInterval) {
        // Same node, re-pulse — drop faded connections first
        this.connections = this.connections.filter(c => c.alpha > 0.04);
        this._emit(nearIdx, ts);
      }

      // ── Advance each connection ──
      for (const c of this.connections) {
        if (!c.complete) {
          c.progress = Math.min(1, c.progress + c.speed * dtFactor);
          if (c.progress >= 1) { c.complete = true; c.completeAt = ts; }
        } else {
          const elapsed = ts - c.completeAt;
          if (elapsed > this.cfg.holdDuration) {
            c.alpha = Math.max(0, 1 - (elapsed - this.cfg.holdDuration) / this.cfg.fadeDuration);
          }
        }
      }

      // ── Prune dead connections ──
      this.connections = this.connections.filter(c => c.alpha > 0.005);

      this._draw();
      requestAnimationFrame((t) => this._tick(t));
    }

    _draw() {
      const { ctx, canvas, dots, connections, activeNodeIdx, cfg } = this;
      const [AR, AG, AB] = [20,  90, 230];
      const [R,  G,  B]  = [21,  29,  60];
      const rDot         = cfg.dotSize / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Track which target dots are currently lit ──
      const litDots = new Map(); // dotIdx → brightness 0–1

      // ─── 1. Animated connection lines ─────────────────────────────────────
      for (const c of connections) {
        if (c.progress < 0.01) continue;

        const from  = dots[c.fromIdx];
        const to    = dots[c.toIdx];
        const dx    = to.x - from.x;
        const dy    = to.y - from.y;
        const dist  = Math.sqrt(dx * dx + dy * dy);

        // Quadratic bezier control point: offset perpendicularly to the line
        // (stored per-connection so the curve stays consistent as it grows)
        const nx    = -dy / dist;   // unit perpendicular
        const ny    =  dx / dist;
        const ctrlX = from.x + dx * 0.5 + nx * c.curve;
        const ctrlY = from.y + dy * 0.5 + ny * c.curve;

        // De Casteljau subdivision at t = progress → gives the partial
        // bezier from origin to the real on-curve tip point (ex, ey)
        const t    = c.progress;
        const q0x  = from.x + (ctrlX - from.x) * t;
        const q0y  = from.y + (ctrlY - from.y) * t;
        const q1x  = ctrlX  + (to.x  - ctrlX ) * t;
        const q1y  = ctrlY  + (to.y  - ctrlY ) * t;
        const ex   = q0x + (q1x - q0x) * t;   // actual on-curve tip
        const ey   = q0y + (q1y - q0y) * t;

        const distFade  = 1 - dist / cfg.maxConnectDist;  // 1 = close, 0 = far
        // Floor at 0.45 so even the longest lines stay clearly visible
        const lineAlpha = c.alpha * (0.45 + distFade * 0.55);

        // Gradient: visible at origin → full brightness at tip
        const grad = ctx.createLinearGradient(from.x, from.y, ex, ey);
        grad.addColorStop(0,   `rgba(${AR},${AG},${AB},${(lineAlpha * 0.35).toFixed(3)})`);
        grad.addColorStop(0.6, `rgba(${AR},${AG},${AB},${(lineAlpha * 0.85).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(${AR},${AG},${AB},${lineAlpha.toFixed(3)})`);

        ctx.lineWidth   = 1.2 + distFade * 0.8;
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        // q0 is the subdivided control point — draws the partial curve correctly
        ctx.quadraticCurveTo(q0x, q0y, ex, ey);
        ctx.stroke();

        // ── Bright energy particle riding the real bezier tip ──
        if (c.progress < 0.97) {
          const pA = (c.alpha * distFade * 0.95).toFixed(3);
          // Soft glow — scaled to bigger grid
          const pg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 9);
          pg.addColorStop(0, `rgba(${AR},${AG},${AB},${(c.alpha * distFade * 0.75).toFixed(3)})`);
          pg.addColorStop(1, `rgba(${AR},${AG},${AB},0)`);
          ctx.beginPath();
          ctx.arc(ex, ey, 9, 0, Math.PI * 2);
          ctx.fillStyle = pg;
          ctx.fill();
          // Hard core
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${AR},${AG},${AB},${pA})`;
          ctx.fill();
        }

        // ── Mark target dot as lit when line arrives ──
        if (c.progress > 0.88) {
          const prev = litDots.get(c.toIdx) || 0;
          litDots.set(c.toIdx, Math.max(prev, c.alpha * distFade));
        }
      }

      // ─── 2. All dots ───────────────────────────────────────────────────────
      for (let i = 0; i < dots.length; i++) {
        const dot     = dots[i];
        const isActive = i === activeNodeIdx;
        const lit      = litDots.get(i) || 0;

        if (isActive) {
          // Radial glow halo — scaled to bigger grid
          const halo = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 38);
          halo.addColorStop(0, `rgba(${AR},${AG},${AB},0.52)`);
          halo.addColorStop(1, `rgba(${AR},${AG},${AB},0)`);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 38, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
          // Core node
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, rDot * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${AR},${AG},${AB},0.95)`;
          ctx.fill();
        } else if (lit > 0.05) {
          // Destination dot lights up on connection arrival
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, rDot * (1.4 + lit * 1.4), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${AR},${AG},${AB},${(0.35 + lit * 0.55).toFixed(3)})`;
          ctx.fill();
        } else {
          // Resting dot
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, rDot, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${R},${G},${B},0.22)`;
          ctx.fill();
        }
      }
    }
  }

  // Boot footer dot grid
  const footerCanvas = document.getElementById('footerDotGrid');
  if (footerCanvas) new FooterDotGrid(footerCanvas);

})();
