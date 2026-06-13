'use strict';

(function() {
  // --- Initialization ---
  function init() {
    initTheme();
    initNav();
    initScrollReveal();
    initSmoothScroll();
    initHeroParticles();
    initReleaseFetcher();
  }

  // --- Theme Management ---
  function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      }
    }

    // Load theme: storage > system
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(mediaQuery.matches ? 'dark' : 'light');
    }

    // Listen to theme switch button
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
      });
    }

    // Listen to system preferences change (only if no override exists)
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // --- Sticky Navigation Scroll behavior ---
  function initNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- Scroll Reveal with IntersectionObserver ---
  function initScrollReveal() {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Stagger children logic
          if (entry.target.classList.contains('reveal-stagger')) {
            const children = entry.target.children;
            Array.from(children).forEach((child, index) => {
              if (isReducedMotion) {
                child.style.transition = 'none';
                child.style.opacity = '1';
                child.style.transform = 'none';
              } else {
                child.style.setProperty('--stagger-delay', `${index * 0.1}s`);
              }
            });
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
    revealElements.forEach(el => observer.observe(el));
  }

  // --- Smooth Scrolling for anchor links ---
  function initSmoothScroll() {
    const nav = document.querySelector('nav');
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;
        
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // --- Hero Section Particle Field ---
  function initHeroParticles() {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) return;

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    let particles = [];
    const particleCount = 40;
    let width = canvas.width = hero.offsetWidth;
    let height = canvas.height = hero.offsetHeight;
    let mouse = { x: -1000, y: -1000 };
    let animationFrameId = null;

    class Particle {
      constructor() {
        this.reset();
        // Distribute initially throughout canvas
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = 1 + Math.random() * 1.5; // radius 1-2.5px
        this.color = Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(52, 211, 153, 0.15)'; // Blue/Green
        this.vx = (Math.random() - 0.5) * 0.4; // Max 0.2px/frame velocity
        this.vy = (Math.random() - 0.5) * 0.4;
        this.opacity = 0.2 + Math.random() * 0.6;
        this.opacitySpeed = 0.005 + Math.random() * 0.01;
        this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        // Opacity oscillation
        this.opacity += this.opacitySpeed * this.opacityDirection;
        if (this.opacity >= 0.8 || this.opacity <= 0.2) {
          this.opacityDirection *= -1;
        }

        // Repulsion from mouse vector
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 120;

        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          const angle = Math.atan2(dy, dx);
          // Gently push particle away
          this.x += Math.cos(angle) * force * 1.8;
          this.y += Math.sin(angle) * force * 1.8;
        }

        // Slow standard drift
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Build color string with current dynamic opacity
        const colorBase = this.color.substring(0, this.color.lastIndexOf(','));
        ctx.fillStyle = `${colorBase}, ${this.opacity * 0.6})`;
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    // Mouse movement listeners
    hero.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    hero.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    // Handle debounced resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        width = canvas.width = hero.offsetWidth;
        height = canvas.height = hero.offsetHeight;
        particles.forEach(p => p.reset());
      }, 150);
    });

    // Start/stop loop based on visibility state
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animate();
      }
    });

    // Start particle system
    animate();
  }

  // --- Dynamic Release Fetching ---
  async function initReleaseFetcher() {
    const statusEl = document.getElementById('download-status');
    const btnWindows = document.getElementById('btn-windows');
    const btnMacos = document.getElementById('btn-macos');
    const btnAndroid = document.getElementById('btn-android');
    const btnLinux = document.getElementById('btn-linux');

    if (!btnWindows) return;

    try {
      // Fetch the specific 'latest-successful-build' release which holds the continuous build artifacts
      const response = await fetch('https://api.github.com/repos/teamantigravity/gravitysend/releases/tags/latest-successful-build');
      if (!response.ok) throw new Error('Failed to fetch releases');
      const data = await response.json();
      
      let windowsUrl, macosUrl, androidUrl, linuxUrl;

      for (const asset of data.assets) {
        if (asset.name.endsWith('-windows-x64.exe')) windowsUrl = asset.browser_download_url;
        else if (asset.name.endsWith('-macos-universal.dmg')) macosUrl = asset.browser_download_url;
        else if (asset.name.endsWith('-android-arm64.apk')) androidUrl = asset.browser_download_url;
        else if (asset.name.endsWith('-linux-x86_64.deb')) linuxUrl = asset.browser_download_url;
      }

      if (windowsUrl) btnWindows.href = windowsUrl;
      if (macosUrl) btnMacos.href = macosUrl;
      if (androidUrl) btnAndroid.href = androidUrl;
      if (linuxUrl) btnLinux.href = linuxUrl;

      if (statusEl) {
        statusEl.textContent = 'Ready to download v' + data.tag_name.replace('v', '');
        statusEl.style.color = 'var(--c-green)';
      }
    } catch (err) {
      console.error('Error fetching release:', err);
      if (statusEl) {
        statusEl.textContent = 'Could not fetch latest release. Links point to releases page.';
        statusEl.style.color = 'var(--c-text-3)';
      }
    }
  }

  // Trigger setup on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();
