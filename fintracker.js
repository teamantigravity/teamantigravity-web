'use strict';

(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    initPreloader();
    initNavScroll();
    initSmoothScroll();
    initRevealObserver();
    initCharCascade();
    initLineReveal();
    initFadeAnim();
    initStoryScroll();
    initCounters();
    initMagnetic();
    initHeroCanvas();
  }

  /* ---------------------------- Preloader ---------------------------- */
  function initPreloader() {
    const el = document.getElementById('ft-preloader');
    const fill = document.getElementById('ft-preloader-fill');
    if (!el) return;

    if (REDUCED_MOTION) {
      el.classList.add('ft-done');
      return;
    }

    let progress = 0;
    const tick = setInterval(() => {
      progress = Math.min(progress + Math.random() * 18, 92);
      if (fill) fill.style.width = progress + '%';
    }, 120);

    const finish = () => {
      clearInterval(tick);
      if (fill) fill.style.width = '100%';
      setTimeout(() => el.classList.add('ft-done'), 280);
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 500);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 300));
      // Never block the page for more than ~2.5s even on a slow connection.
      setTimeout(finish, 2500);
    }
  }

  /* ---------------------------- Nav scroll shadow ---------------------------- */
  function initNavScroll() {
    const nav = document.querySelector('.ft-nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------- Smooth scroll ---------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------------------- .reveal / .reveal-stagger ---------------------------- */
  function initRevealObserver() {
    const els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
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

  /* ---------------------------- Char cascade ---------------------------- */
  function initCharCascade() {
    const targets = document.querySelectorAll('[data-ft-anim="chars"]');
    targets.forEach((el) => {
      if (REDUCED_MOTION) return;
      // Walk text nodes, wrapping each visible character in a span, while
      // preserving existing child elements (e.g. <br>, colored spans).
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split('').forEach((ch) => {
              const span = document.createElement('span');
              span.className = 'ft-char';
              span.textContent = ch;
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(el);

      const chars = el.querySelectorAll('.ft-char');
      let i = 0;
      chars.forEach((c) => {
        c.style.transitionDelay = `${Math.min(i, 40) * 18}ms`;
        i++;
      });

      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          chars.forEach((c) => c.classList.add('in'));
          obs.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(el);
    });
  }

  /* ---------------------------- Line reveal ---------------------------- */
  function initLineReveal() {
    const targets = document.querySelectorAll('[data-ft-anim="lines"]');
    targets.forEach((el) => {
      if (REDUCED_MOTION) return;
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      const wordSpans = words.map((w, i) => {
        const span = document.createElement('span');
        span.textContent = w + (i < words.length - 1 ? '\u00A0' : '');
        span.style.display = 'inline-block';
        el.appendChild(span);
        return span;
      });

      // Group words into visual lines by their rendered offsetTop.
      requestAnimationFrame(() => {
        const lines = [];
        let currentTop = null;
        let currentWords = [];
        wordSpans.forEach((span) => {
          const top = span.offsetTop;
          if (currentTop === null || Math.abs(top - currentTop) < 4) {
            currentWords.push(span);
            currentTop = top;
          } else {
            lines.push(currentWords);
            currentWords = [span];
            currentTop = top;
          }
        });
        if (currentWords.length) lines.push(currentWords);

        el.textContent = '';
        lines.forEach((lineWords, i) => {
          const wrap = document.createElement('span');
          wrap.className = 'ft-line-wrap';
          const line = document.createElement('span');
          line.className = 'ft-line';
          line.style.transitionDelay = `${i * 80}ms`;
          lineWords.forEach((w) => line.appendChild(w));
          wrap.appendChild(line);
          el.appendChild(wrap);
        });

        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            el.querySelectorAll('.ft-line').forEach((l) => l.classList.add('in'));
            obs.disconnect();
          });
        }, { threshold: 0.3 });
        io.observe(el);
      });
    });
  }

  /* ---------------------------- Simple fade ---------------------------- */
  function initFadeAnim() {
    const targets = document.querySelectorAll('[data-ft-anim="fade"]');
    if (!targets.length) return;
    if (REDUCED_MOTION) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------- Story scroll (sticky visual sync) ---------------------------- */
  function initStoryScroll() {
    const cards = document.querySelectorAll('.ft-feature-card');
    const dots = document.querySelectorAll('.ft-story-dot');
    const visual = document.getElementById('ft-story-visual');
    if (!cards.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          const color = entry.target.getAttribute('data-color');
          dots.forEach((d) => d.classList.toggle('active', d.getAttribute('data-color') === color));
          if (visual) visual.setAttribute('data-active', color);
        }
      });
    }, { threshold: 0.5 });

    cards.forEach((c) => io.observe(c));
  }

  /* ---------------------------- Animated counters ---------------------------- */
  function initCounters() {
    const counters = document.querySelectorAll('.ft-counter');
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseFloat(el.getAttribute('data-target') || '0');
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      if (REDUCED_MOTION) {
        el.textContent = prefix + target + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(target * eased);
        el.textContent = prefix + value + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------------------------- Magnetic buttons ---------------------------- */
  function initMagnetic() {
    if (REDUCED_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('.ft-magnetic').forEach((btn) => {
      const strength = 0.35;
      const max = 14;
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        btn.style.transition = 'transform 0.1s linear';
        btn.style.transform = `translate(${Math.max(-max, Math.min(max, dx))}px, ${Math.max(-max, Math.min(max, dy))}px)`;
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------------------------- Hero particle field ---------------------------- */
  function initHeroCanvas() {
    if (REDUCED_MOTION) return;
    const canvas = document.getElementById('ft-hero-canvas');
    const hero = document.querySelector('.ft-hero');
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
      const count = Math.min(70, Math.floor((w * h) / 20000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
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
        ctx.fillStyle = `rgba(${p.c},0.65)`; ctx.fill();
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

  document.addEventListener('DOMContentLoaded', init);
})();
