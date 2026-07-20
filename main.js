'use strict';

(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RELEASES = {
    'gravity-torrent': 'https://github.com/teamantigravity/gravity-torrent/releases',
    'gravity-send': 'https://github.com/teamantigravity/gravitysend/releases',
    'gravity-installer': 'https://github.com/teamantigravity/gravityinstaller/releases',
    'gravity-fintracker': 'https://github.com/teamantigravity/gravity-fintracker/releases',
  };
  // Platforms that have a resolvable direct download per product.
  const DOWNLOADABLE = {
    'gravity-torrent': ['windows', 'macos', 'linux', 'linux-arm64', 'android', 'ios'],
    'gravity-send': ['windows', 'macos', 'linux', 'android', 'ios'],
    'gravity-installer': ['android'],
    // Web has no single downloadable artifact — falls back to the releases page.
    'gravity-fintracker': ['windows', 'macos', 'linux', 'android'],
  };

  function initManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';
    document.head.appendChild(manifest);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.sizes = '180x180';
    apple.href = '/apple-touch-icon.png';
    document.head.appendChild(apple);
  }

  function init() {
    initManifest();
    initTheme();
    initNav();
    initMobileNav();
    initSmoothScroll();
    initScrollReveal();
    initHeroCanvas();
    initTilt();
    initBuildStatus();
    initPlatformDetection();
  }

  /* ---------------------------- Theme ---------------------------- */
  function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // Helper to apply theme and update button state
    const apply = (theme, save = true) => {
      document.documentElement.setAttribute('data-theme', theme);
      if (save) {
        try { localStorage.setItem('theme', theme); } catch (_) {}
      }
      if (btn) {
        const isDark = theme === 'dark';
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      }
    };

    // Initial state setup
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (_) {}
    let currentTheme = saved || (mq.matches ? 'dark' : 'light');
    
    // The actual FOUC prevention should be an inline script in HTML,
    // but we re-apply here to ensure button state is correct.
    apply(currentTheme, !!saved);

    if (btn) {
      btn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        apply(currentTheme, true);
      });
    }

    mq.addEventListener('change', (e) => {
      let hasPreference = false;
      try { hasPreference = !!localStorage.getItem('theme'); } catch (_) {}
      if (!hasPreference) {
        currentTheme = e.matches ? 'dark' : 'light';
        apply(currentTheme, false); // Don't save to localStorage if it's just system changing
      }
    });
  }

  /* ---------------------------- Nav ---------------------------- */
  function initNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------- Mobile nav ---------------------------- */
  function initMobileNav() {
    const nav = document.querySelector('nav');
    const links = document.querySelector('.nav-links');
    if (!nav || !links) return;
    if (document.getElementById('mobile-menu-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'mobile-menu-toggle';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'primary-menu');
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
    links.id = 'primary-menu';
    links.parentNode.insertBefore(toggle, links);

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 920) setOpen(false); });
  }

  /* ------------------------ Smooth scroll ------------------------ */
  function initSmoothScroll() {
    const nav = document.querySelector('nav');
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = (nav ? nav.offsetHeight : 0) + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
      });
    });
  }

  /* ----------------------- Scroll reveal ----------------------- */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!('IntersectionObserver' in window) || REDUCED_MOTION) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        if (entry.target.classList.contains('reveal-stagger')) {
          Array.from(entry.target.children).forEach((child, i) => {
            child.style.setProperty('--stagger-delay', `${i * 0.09}s`);
          });
        }
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  /* --------------------- Hero particle field --------------------- */
  function initHeroCanvas() {
    if (REDUCED_MOTION) return;
    const canvas = document.getElementById('hero-canvas');
    const hero = document.querySelector('.hero');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = ['66,133,244', '234,67,53', '251,188,5', '52,168,83'];
    let w, h, dpr, particles, raf, mouse = { x: -9999, y: -9999 };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth; h = hero.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(64, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.8, c: COLORS[(Math.random() * COLORS.length) | 0],
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 130) { const f = (130 - d) / 130; p.x += (dx / d) * f * 1.6; p.y += (dy / d) * f * 1.6; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},0.7)`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${p.c},${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    frame();
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(size, 180); });
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) frame();
    });
  }

  /* --------------------------- 3D tilt --------------------------- */
  function initTilt() {
    if (REDUCED_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const MAX = 5;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.1s linear';
        el.style.transform = `perspective(1100px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        el.style.transform = 'perspective(1100px) rotateX(0) rotateY(0)';
      });
    });
  }

  /* ----------------------- Build status ----------------------- */
  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (m < 2) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (hr < 24) return `${hr}h ago`;
    return `${d}d ago`;
  }

  function resolveStatus(run) {
    if (!run) return { label: 'Unknown', dot: 'status-unknown' };
    const url = run.url || run.html_url;
    const date = run.date || run.started_at || run.created_at;
    if (['in_progress', 'queued', 'waiting', 'pending', 'requested'].includes(run.status)) {
      return { label: 'Building', dot: 'status-progress', url, date };
    }
    if (run.status === 'completed') {
      if (run.conclusion === 'success') return { label: 'Passing', dot: 'status-pass', url, date };
      if (['failure', 'timed_out', 'startup_failure'].includes(run.conclusion)) return { label: 'Failing', dot: 'status-fail', url, date };
      if (run.conclusion === 'cancelled') return { label: 'Cancelled', dot: 'status-unknown', url, date };
    }
    return { label: 'Unknown', dot: 'status-unknown', url, date };
  }

  function updatePill(pill, product, s) {
    const dot = pill.querySelector('.status-dot');
    const label = pill.querySelector('.pill-label');
    if (dot) dot.className = `status-dot ${s.dot}`;
    const ago = timeAgo(s.date);
    pill.setAttribute('data-tooltip', ago ? `${s.label} · ${ago}` : s.label);
    if (label) pill.setAttribute('aria-label', `${label.textContent}: ${s.label}${ago ? ' ' + ago : ''}`);

    const platform = pill.getAttribute('data-platform');
    const downloadable = (DOWNLOADABLE[product] || []).includes(platform);
    const href = downloadable
      ? `/api/latest-download?product=${product}&platform=${platform}`
      : RELEASES[product];
    pill.setAttribute('role', 'link');
    pill.setAttribute('tabindex', '0');
    pill.style.cursor = 'pointer';
    const go = () => window.open(href, '_blank', 'noopener');
    pill.onclick = go;
    pill.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  }

  async function loadProduct(container) {
    const product = container.getAttribute('data-product');
    const pills = container.querySelectorAll('.platform-pill');
    const updatedEl = document.querySelector(`[data-updated-for="${product}"]`);

    let statuses = null;
    try {
      const res = await fetch(`/api/build-status?product=${product}`);
      if (res.ok) statuses = await res.json();
    } catch (_) {}

    if (!statuses || statuses.error) {
      // Graceful fallback: leave dots as unknown but keep pills actionable.
      pills.forEach((pill) => updatePill(pill, product, { label: 'Status unavailable', dot: 'status-unknown' }));
    } else {
      pills.forEach((pill) => {
        const platform = pill.getAttribute('data-platform');
        updatePill(pill, product, resolveStatus(statuses[platform]));
      });
    }

    if (updatedEl) {
      const now = new Date();
      updatedEl.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · always serves the latest successful build`;
    }
  }

  function initBuildStatus() {
    const containers = document.querySelectorAll('.platforms[data-product]');
    if (!containers.length) return;

    const POLL_MS = 5 * 60 * 1000; // 5 minutes
    let timer = null;

    const run = () => {
      if (document.hidden) return;
      containers.forEach(loadProduct);
    };

    run();
    timer = setInterval(run, POLL_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      run();
    });

    window.addEventListener('beforeunload', () => clearInterval(timer));
  }

  /* ---------------------------- Platform detection ---------------------------- */
  function getPlatform() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Macintosh|Mac OS X/.test(ua)) return 'macos';
    if (/Windows/.test(ua)) return 'windows';
    if (/Linux/.test(ua)) return 'linux';
    return null;
  }

  function initPlatformDetection() {
    const platform = getPlatform();
    if (!platform) return;

    const buttons = document.querySelectorAll('.dl-btn');
    buttons.forEach((btn) => {
      const href = btn.getAttribute('href') || '';
      if (href.includes(`platform=${platform}`)) {
        btn.classList.add('dl-recommended');
        btn.setAttribute('aria-label', `${btn.textContent.trim()} (recommended for your device)`);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
