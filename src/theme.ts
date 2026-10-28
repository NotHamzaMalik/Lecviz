export type Theme = 'light' | 'dark';

const THEME_KEY = 'lecviz.showcase.theme';

// Light is the default look and feel.
export function getInitialTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore storage failures
  }
}
