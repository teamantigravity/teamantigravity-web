'use strict';

(function () {
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    var manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';
    document.head.appendChild(manifest);

    var apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.sizes = '180x180';
    apple.href = '/apple-touch-icon.png';
    document.head.appendChild(apple);
  }

  function init() {
    initManifest();
    initPreloader();
    initNavScroll();
    initMobileNav();
    initSmoothScroll();
    initRevealObserver();
    initCharCascade();
    initLineReveal();
    initFadeAnim();
    initStoryScroll();
    initCounters();
    initMagnetic();
    initSpotlight();
    initFaq();
    initTrustStrip();
    initHeroCanvas();
  }

  /* ---------------------------- Preloader ---------------------------- */
  function initPreloader() {
    var el = document.getElementById('pd-preloader');
    var fill = document.getElementById('pd-preloader-fill');
    if (!el) return;

    if (REDUCED_MOTION) {
      el.classList.add('pd-done');
      return;
    }

    var progress = 0;
    var tick = setInterval(function () {
      progress = Math.min(progress + Math.random() * 18, 92);
      if (fill) fill.style.width = progress + '%';
    }, 120);

    var finish = function () {
      clearInterval(tick);
      if (fill) fill.style.width = '100%';
      setTimeout(function () { el.classList.add('pd-done'); }, 280);
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 300);
    } else {
      window.addEventListener('load', function () { setTimeout(finish, 200); });
      setTimeout(finish, 1500);
    }
  }

  /* ---------------------------- Nav scroll shadow ---------------------------- */
  function initNavScroll() {
    var nav = document.querySelector('.pd-nav');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 30); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------- Mobile nav ---------------------------- */
  function initMobileNav() {
    var nav = document.querySelector('.pd-nav') || document.querySelector('nav');
    var links = document.querySelector('.nav-links');
    if (!nav || !links) return;
    if (document.getElementById('mobile-menu-toggle')) return;

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'mobile-menu-toggle';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'primary-menu');
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
    links.id = 'primary-menu';
    nav.querySelector('.nav-actions').insertBefore(toggle, links);

    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 920) setOpen(false); });
  }

  /* ---------------------------- Smooth scroll ---------------------------- */
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      (function (link) {
        link.addEventListener('click', function (e) {
          var id = link.getAttribute('href');
          if (!id || id === '#') return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top: top, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        });
      })(links[i]);
    }
  }

  /* ---------------------------- .reveal / .reveal-stagger ---------------------------- */
  function initRevealObserver() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || REDUCED_MOTION) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('revealed');
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('revealed');
        if (entries[i].target.classList.contains('reveal-stagger')) {
          var children = entries[i].target.children;
          for (var j = 0; j < children.length; j++) {
            children[j].style.setProperty('--stagger-delay', (j * 0.09) + 's');
          }
        }
        obs.unobserve(entries[i].target);
      }
    }, { threshold: 0.12 });
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* ---------------------------- Char cascade ---------------------------- */
  function initCharCascade() {
    var targets = document.querySelectorAll('[data-pd-anim="chars"]');
    for (var t = 0; t < targets.length; t++) {
      (function (el) {
        if (REDUCED_MOTION) return;
        var walk = function (node) {
          var nodes = Array.prototype.slice.call(node.childNodes);
          for (var i = 0; i < nodes.length; i++) {
            var child = nodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
              var frag = document.createDocumentFragment();
              var text = child.textContent.split('');
              for (var j = 0; j < text.length; j++) {
                var span = document.createElement('span');
                span.className = 'pd-char';
                span.textContent = text[j];
                frag.appendChild(span);
              }
              node.replaceChild(frag, child);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              walk(child);
            }
          }
        };
        walk(el);

        var chars = el.querySelectorAll('.pd-char');
        var idx = 0;
        for (var i = 0; i < chars.length; i++) {
          chars[i].style.transitionDelay = (Math.min(idx, 40) * 18) + 'ms';
          idx++;
        }

        var io = new IntersectionObserver(function (entries, obs) {
          for (var i = 0; i < entries.length; i++) {
            if (!entries[i].isIntersecting) continue;
            for (var j = 0; j < chars.length; j++) chars[j].classList.add('in');
            obs.disconnect();
          }
        }, { threshold: 0.3 });
        io.observe(el);
      })(targets[t]);
    }
  }

  /* ---------------------------- Line reveal ---------------------------- */
  function initLineReveal() {
    var targets = document.querySelectorAll('[data-pd-anim="lines"]');
    for (var t = 0; t < targets.length; t++) {
      (function (el) {
        if (REDUCED_MOTION) return;
        var words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        var wordSpans = [];
        for (var i = 0; i < words.length; i++) {
          var span = document.createElement('span');
          span.textContent = words[i] + (i < words.length - 1 ? '\u00A0' : '');
          span.style.display = 'inline-block';
          el.appendChild(span);
          wordSpans.push(span);
        }

        requestAnimationFrame(function () {
          var lines = [];
          var currentTop = null;
          var currentWords = [];
          for (var i = 0; i < wordSpans.length; i++) {
            var top = wordSpans[i].offsetTop;
            if (currentTop === null || Math.abs(top - currentTop) < 4) {
              currentWords.push(wordSpans[i]);
              currentTop = top;
            } else {
              lines.push(currentWords);
              currentWords = [wordSpans[i]];
              currentTop = top;
            }
          }
          if (currentWords.length) lines.push(currentWords);

          el.textContent = '';
          for (var i = 0; i < lines.length; i++) {
            var wrap = document.createElement('span');
            wrap.className = 'pd-line-wrap';
            var line = document.createElement('span');
            line.className = 'pd-line';
            line.style.transitionDelay = (i * 80) + 'ms';
            for (var j = 0; j < lines[i].length; j++) line.appendChild(lines[i][j]);
            wrap.appendChild(line);
            el.appendChild(wrap);
          }

          var io = new IntersectionObserver(function (entries, obs) {
            for (var i = 0; i < entries.length; i++) {
              if (!entries[i].isIntersecting) continue;
              var allLines = el.querySelectorAll('.pd-line');
              for (var j = 0; j < allLines.length; j++) allLines[j].classList.add('in');
              obs.disconnect();
            }
          }, { threshold: 0.3 });
          io.observe(el);
        });
      })(targets[t]);
    }
  }

  /* ---------------------------- Simple fade ---------------------------- */
  function initFadeAnim() {
    var targets = document.querySelectorAll('[data-pd-anim="fade"]');
    if (!targets.length) return;
    if (REDUCED_MOTION) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('in');
        obs.unobserve(entries[i].target);
      }
    }, { threshold: 0.2 });
    for (var i = 0; i < targets.length; i++) io.observe(targets[i]);
  }

  /* ---------------------------- Story scroll (sticky visual sync) ---------------------------- */
  function initStoryScroll() {
    var cards = document.querySelectorAll('.pd-feature-card');
    var dots = document.querySelectorAll('.pd-story-dot');
    var visual = document.getElementById('pd-story-visual');
    if (!cards.length) return;

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('in-view');
          var color = entries[i].target.getAttribute('data-color');
          for (var j = 0; j < dots.length; j++) {
            dots[j].classList.toggle('active', dots[j].getAttribute('data-color') === color);
          }
          if (visual) visual.setAttribute('data-active', color);
        }
      }
    }, { threshold: 0.5 });

    for (var i = 0; i < cards.length; i++) io.observe(cards[i]);
  }

  /* ---------------------------- Animated counters ---------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('.pd-counter');
    if (!counters.length) return;

    var animate = function (el) {
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (REDUCED_MOTION) {
        el.textContent = prefix + target + suffix;
        return;
      }
      var duration = 1400;
      var start = performance.now();
      var step = function (now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var value = Math.round(target * eased);
        el.textContent = prefix + value + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        animate(entries[i].target);
        obs.unobserve(entries[i].target);
      }
    }, { threshold: 0.4 });
    for (var i = 0; i < counters.length; i++) io.observe(counters[i]);
  }

  /* ---------------------------- Magnetic buttons ---------------------------- */
  function initMagnetic() {
    if (REDUCED_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
    var btns = document.querySelectorAll('.pd-magnetic');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        var strength = 0.35;
        var max = 14;
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) * strength;
          var dy = (e.clientY - (r.top + r.height / 2)) * strength;
          btn.style.transition = 'transform 0.1s linear';
          btn.style.transform = 'translate(' + Math.max(-max, Math.min(max, dx)) + 'px, ' + Math.max(-max, Math.min(max, dy)) + 'px)';
        });
        btn.addEventListener('pointerleave', function () {
          btn.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
          btn.style.transform = 'translate(0,0)';
        });
      })(btns[i]);
    }
  }

  /* ---------------------------- Cursor spotlight ---------------------------- */
  function initSpotlight() {
    if (REDUCED_MOTION || !window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('.pd-spotlight').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty('--spot-x', x + '%');
        el.style.setProperty('--spot-y', y + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.removeProperty('--spot-x');
        el.style.removeProperty('--spot-y');
      });
    });
  }

  /* ---------------------------- FAQ accordion ---------------------------- */
  function initFaq() {
    var items = document.querySelectorAll('.pd-faq-item');
    if (!items.length) return;
    items.forEach(function (item) {
      var q = item.querySelector('.pd-faq-question');
      if (!q) return;
      q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', function () {
        var open = item.classList.contains('open');
        items.forEach(function (sib) {
          sib.classList.remove('open');
          var sq = sib.querySelector('.pd-faq-question');
          if (sq) sq.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('open');
          q.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------------------- Live trust strip ---------------------------- */
  function timeAgo(iso) {
    if (!iso) return '';
    var diff = Date.now() - new Date(iso).getTime();
    var m = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (m < 2) return 'just now';
    if (m < 60) return m + 'm ago';
    if (hr < 24) return hr + 'h ago';
    return d + 'd ago';
  }

  function initTrustStrip() {
    var strips = document.querySelectorAll('.pd-trust[data-product]');
    if (!strips.length) return;
    var map = {
      'gravity-fintracker': 'gravity-fintracker',
      'gravity-send': 'gravitysend',
      'gravity-installer': 'gravityinstaller',
      'gravity-torrent': 'gravity-torrent'
    };
    var product = strips[0].getAttribute('data-product');
    var repo = map[product] || product;
    var owner = 'teamantigravity';

    fetch('https://api.github.com/repos/' + owner + '/' + repo)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var el = strips[0].querySelector('.pd-trust-stars .pd-trust-value');
        if (el) el.textContent = (data.stargazers_count || 0).toLocaleString();
      })
      .catch(function () {});

    fetch('https://api.github.com/repos/' + owner + '/' + repo + '/releases/latest')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rel) {
        if (!rel) return;
        var tag = strips[0].querySelector('.pd-trust-version .pd-trust-value');
        if (tag) tag.textContent = rel.tag_name || '—';
        var date = strips[0].querySelector('.pd-trust-released .pd-trust-value');
        if (date) date.textContent = rel.published_at ? timeAgo(rel.published_at) : '—';
      })
      .catch(function () {});
  }

  /* ---------------------------- Hero particle field ---------------------------- */
  function initHeroCanvas() {
    if (REDUCED_MOTION) return;
    var canvas = document.getElementById('pd-hero-canvas');
    var hero = document.querySelector('.pd-hero');
    if (!canvas || !hero) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var theme = canvas.getAttribute('data-particle-theme') || 'default';
    var THEMES = {
      default: ['66,133,244', '234,67,53', '251,188,5', '52,168,83'],
      fintracker: ['52,168,83', '66,133,244', '251,188,5', '234,67,53'],
      send: ['66,133,244', '52,168,83', '251,188,5', '234,67,53'],
      torrent: ['124,77,255', '66,133,244', '251,188,5', '234,67,53'],
      installer: ['251,188,5', '234,67,53', '52,168,83', '66,133,244']
    };
    var COLORS = THEMES[theme] || THEMES.default;

    var w, h, dpr, particles = [], raf;
    var CONFIG = {
      maxParticles: 90,
      baseSpeed: 0.28,
      connectionDistance: 120,
      mouseRadius: 170
    };
    var mouse = { x: -9999, y: -9999 };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.offsetWidth; h = hero.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(CONFIG.maxParticles, Math.max(30, Math.floor((w * h) / 16000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
          vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
          r: 1.3 + Math.random() * 1.7,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.hypot(dx, dy);
        if (d < CONFIG.mouseRadius && d > 0.5) {
          var f = (CONFIG.mouseRadius - d) / CONFIG.mouseRadius;
          var angle = Math.atan2(dy, dx);
          var push = f * 1.6;
          p.vx += Math.cos(angle) * push * 0.025;
          p.vy += Math.sin(angle) * push * 0.025;
        }
        p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -12) p.x = w + 12; if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12; if (p.y > h + 12) p.y = -12;
        p.pulse += 0.04;
        var r = Math.max(0.4, p.r + Math.sin(p.pulse) * 0.35);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c + ',0.85)'; ctx.fill();
      }

      ctx.lineWidth = 0.7;
      for (var i = 0; i < particles.length; i++) {
        var p1 = particles[i];
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var ldx = p1.x - p2.x, ldy = p1.y - p2.y;
          var dist = Math.hypot(ldx, ldy);
          if (dist < CONFIG.connectionDistance) {
            var alpha = 0.14 * (1 - dist / CONFIG.connectionDistance);
            ctx.strokeStyle = 'rgba(' + p1.c + ',' + alpha + ')';
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    frame();
    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(size, 180); });
    document.addEventListener('visibilitychange', function () {
      cancelAnimationFrame(raf);
      if (!document.hidden) frame();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
