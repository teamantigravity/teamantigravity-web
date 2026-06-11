document.addEventListener('DOMContentLoaded', () => {
  // --- Neural Theme Architecture ---
  const themeToggle = document.getElementById('theme-toggle');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Apply theme to DOM and save to localStorage
  const setTheme = (theme, saveToStorage = true) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (saveToStorage) {
      localStorage.setItem('neural-theme', theme);
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Activate Light Space' : 'Activate Dark Space');
    }
  };

  // Initialization: User Preference > OS Preference
  const savedTheme = localStorage.getItem('neural-theme');
  if (savedTheme) {
    setTheme(savedTheme, false);
  } else {
    setTheme(mediaQuery.matches ? 'dark' : 'light', false);
  }

  // Real-time OS Theme Tracker (Neural Adaptation)
  mediaQuery.addEventListener('change', (e) => {
    // Only adapt automatically if the user hasn't forced a specific theme
    if (!localStorage.getItem('neural-theme')) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  });

  // Manual Override via Toggle Button
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme, true);
    });
  }

  // --- Intersection Observer for Organic Scroll Reveals ---
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));
});
