import { useEffect } from 'preact/hooks';
import type { ThemePreference } from '../../types';

/** Apply the theme to <html>, following the OS setting live when set to "system". */
export function useTheme(theme: ThemePreference) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const effective = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.setAttribute('data-theme', effective);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
