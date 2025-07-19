type Theme = 'default' | 'light' | 'dark';

class ThemeStore {
  #theme = $state<Theme>('default');
  #systemTheme = $state<'light' | 'dark'>('light');
  #initialized = false;

  constructor() {
    // Initialize on next tick to avoid effect_orphan error
    if (typeof window !== 'undefined') {
      queueMicrotask(() => {
        this.initialize();
      });
    }
  }

  private initialize() {
    if (this.#initialized) return;
    this.#initialized = true;

    // Initialize system theme detection
    this.detectSystemTheme();
    
    // Load saved theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['default', 'light', 'dark'].includes(savedTheme)) {
        this.#theme = savedTheme;
      }
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        this.detectSystemTheme();
        this.applyTheme();
      });
    }

    // Apply initial theme
    this.applyTheme();
  }

  get theme(): Theme {
    return this.#theme;
  }

  get systemTheme(): 'light' | 'dark' {
    return this.#systemTheme;
  }

  get effectiveTheme(): 'light' | 'dark' {
    if (this.#theme === 'default') {
      return this.#systemTheme;
    }
    return this.#theme as 'light' | 'dark';
  }

  setTheme(theme: Theme) {
    this.#theme = theme;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }

    // Apply theme immediately
    this.applyTheme();
  }

  private detectSystemTheme() {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.#systemTheme = prefersDark ? 'dark' : 'light';
    }
  }

  private applyTheme() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const effective = this.effectiveTheme;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      // Add the effective theme class
      root.classList.add(effective);
      
      // Set data attribute for CSS targeting
      root.setAttribute('data-theme', effective);
    }
  }
}

export const themeStore = new ThemeStore();