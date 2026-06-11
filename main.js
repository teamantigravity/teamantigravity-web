document.addEventListener('DOMContentLoaded', () => {
  // --- Neural Theme Architecture ---
  const themeToggle = document.getElementById('theme-toggle');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  
  // Apply theme to DOM and save to localStorage
  const setTheme = (theme, saveToStorage = true) => {
    root.setAttribute('data-theme', theme);
    if (saveToStorage) {
      localStorage.setItem('neural-theme', theme);
    }
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Activate Light Space' : 'Activate Dark Space');
    }
    updateAtmosphere(); // Re-calculate atmosphere when theme changes
  };

  // Initialization: User Preference > OS Preference
  const savedTheme = localStorage.getItem('neural-theme');
  if (savedTheme) {
    setTheme(savedTheme, false);
  } else {
    setTheme(mediaQuery.matches ? 'dark' : 'light', false);
  }

  // Real-time OS Theme Tracker
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('neural-theme')) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  });

  // Manual Override
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = root.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme, true);
    });
  }

  // --- Atmospheric Engine (Season & Time of Day) ---
  function updateAtmosphere() {
    const date = new Date();
    const month = date.getMonth(); // 0-11
    const hour = date.getHours(); // 0-23
    
    // Determine Season
    let season = 'winter';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'autumn';

    // Determine Time of Day
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 11) timeOfDay = 'morning';
    else if (hour >= 11 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 20) timeOfDay = 'evening';

    // Top-tier curated color palettes for seasons (RGB values)
    const palettes = {
      spring: ['167, 243, 208', '244, 165, 255', '147, 197, 253', '253, 230, 138'], // Soft greens, pinks, blues
      summer: ['253, 224, 71', '103, 232, 249', '134, 239, 172', '251, 146, 60'], // Vibrant yellows, cyans, greens
      autumn: ['249, 115, 22', '161, 98, 7', '252, 211, 77', '225, 29, 72'], // Deep oranges, browns, reds
      winter: ['147, 197, 253', '196, 181, 253', '248, 250, 252', '56, 189, 248']  // Frosty blues, purples, white
    };

    // Opacity tuning based on time of day to match the vibe
    const opacities = {
      morning:   { light: 0.35, dark: 0.20 },
      afternoon: { light: 0.45, dark: 0.25 },
      evening:   { light: 0.55, dark: 0.35 },
      night:     { light: 0.25, dark: 0.12 }
    };

    const isDark = root.getAttribute('data-theme') === 'dark';
    const opacity = isDark ? opacities[timeOfDay].dark : opacities[timeOfDay].light;
    const colors = palettes[season];

    // Inject the atmospheric variables into the CSS globally
    root.style.setProperty('--mesh-color-1', `rgba(${colors[0]}, ${opacity})`);
    root.style.setProperty('--mesh-color-2', `rgba(${colors[1]}, ${opacity})`);
    root.style.setProperty('--mesh-color-3', `rgba(${colors[2]}, ${opacity})`);
    root.style.setProperty('--mesh-color-4', `rgba(${colors[3]}, ${opacity})`);
  }

  // Initial atmosphere setup
  updateAtmosphere();
  // Update atmosphere every minute to catch hour changes smoothly
  setInterval(updateAtmosphere, 60000);

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
