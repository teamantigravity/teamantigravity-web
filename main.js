'use strict';

(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const RELEASES = {
    'gravity-torrent': 'https://github.com/teamantigravity/gravity-torrent/releases',
    'gravity-send': 'https://github.com/teamantigravity/gravitysend/releases',
  };
  // Platforms that have a resolvable direct download per product.
  const DOWNLOADABLE = {
    'gravity-torrent': ['windows', 'macos', 'linux', 'linux-arm64', 'android', 'ios'],
    'gravity-send': ['windows', 'macos', 'linux', 'android', 'ios'],
  };

  function init() {
    initTheme();
    initNav();
    initSmoothScroll();
    initScrollReveal();
    initHeroCanvas();
    initTilt();
    initBuildStatus();
  }

  /* ---------------------------- Theme ---------------------------- */
  function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // Apply specific theme ('light', 'dark', or 'system')
    const apply = (theme) => {
      if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
        try { localStorage.removeItem('theme'); } catch (_) {}
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (_) {}
      }

      if (btn) {
        // Update aria-label based on current *effective* state
        const isDark = theme === 'dark' || (theme === 'system' && mq.matches);
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      }
    };

    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (_) {}
    
    // Initial load: apply saved theme, or fallback to system
    apply(saved || 'system');

    if (btn) {
      btn.addEventListener('click', () => {
        let currentTheme = null;
        try { currentTheme = localStorage.getItem('theme'); } catch (_) {}

        if (!currentTheme) {
          // System -> explicit
          apply(mq.matches ? 'light' : 'dark');
        } else if (currentTheme === 'light') {
          // Light -> dark
          apply('dark');
        } else {
          // Dark -> system
          apply('system');
        }
      });
    }

    mq.addEventListener('change', (e) => {
      let currentTheme = null;
      try { currentTheme = localStorage.getItem('theme'); } catch (_) {}
      // If we are in system mode, ensure aria-label updates
      if (!currentTheme) apply('system');
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
    const run = () => containers.forEach(loadProduct);
    run();
    setInterval(run, 60000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
