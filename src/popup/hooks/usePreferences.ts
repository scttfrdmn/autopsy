import { useCallback, useEffect, useState } from 'preact/hooks';
import type { Preferences } from '../../types';
import { DEFAULT_COLUMN_WIDTHS, DEFAULT_PREFERENCES, POPUP_WIDTHS } from '../../lib/constants';

const KEY = 'preferences';
// v0.22 stored these as separate keys.
const LEGACY_KEYS = ['popupWidth', 'theme', 'columnWidths'];

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([KEY, ...LEGACY_KEYS]).then(result => {
      const stored = (result[KEY] as Partial<Preferences> | undefined) ?? {};
      const merged: Preferences = {
        ...DEFAULT_PREFERENCES,
        ...(result.theme ? { theme: result.theme as Preferences['theme'] } : {}),
        ...stored,
        columnWidths: { ...DEFAULT_COLUMN_WIDTHS, ...stored.columnWidths },
      };
      // Chrome clips popups wider than 800px.
      merged.popupWidth = Math.min(merged.popupWidth, POPUP_WIDTHS.L);
      setPrefs(merged);
      setLoaded(true);
      if (LEGACY_KEYS.some(k => k in result)) {
        chrome.storage.local.remove(LEGACY_KEYS);
        chrome.storage.local.set({ [KEY]: merged });
      }
    });
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  return { prefs, loaded, update };
}
