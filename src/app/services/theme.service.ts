import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'theme_preference';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Theme state signal
  readonly theme = signal<ThemeMode>(this.getInitialTheme());

  // OS system dark mode signal
  readonly systemPrefersDark = signal<boolean>(this.checkSystemDark());

  // Computed active dark mode status
  readonly isDarkMode = computed(() => {
    const current = this.theme();
    if (current === 'dark') return true;
    if (current === 'light') return false;
    return this.systemPrefersDark();
  });

  private mediaQueryList: MediaQueryList | null = null;
  private mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor() {
    this.initSystemListener();

    // Effect: Apply/remove 'dark' class on <html> and update meta theme-color
    effect(() => {
      const dark = this.isDarkMode();
      this.applyThemeToDOM(dark);
    });

    // Effect: Persist preference to localStorage
    effect(() => {
      const current = this.theme();
      try {
        localStorage.setItem(THEME_STORAGE_KEY, current);
      } catch (e) {
        console.warn('Unable to persist theme to localStorage', e);
      }
    });
  }

  public setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  public toggleNextTheme(): void {
    const current = this.theme();
    if (current === 'system') this.setTheme('light');
    else if (current === 'light') this.setTheme('dark');
    else this.setTheme('system');
  }

  private getInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 'system';
  }

  private checkSystemDark(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  private initSystemListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(this.mediaQueryList.matches);

    this.mediaListener = (e: MediaQueryListEvent) => {
      this.systemPrefersDark.set(e.matches);
    };

    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', this.mediaListener);
    } else {
      // Fallback for older browsers
      (this.mediaQueryList as any).addListener(this.mediaListener);
    }
  }

  private applyThemeToDOM(isDark: boolean): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update <meta name="theme-color"> for iOS Safari & mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', isDark ? '#090d16' : '#ffffff');
  }
}
