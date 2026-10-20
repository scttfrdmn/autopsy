import { useEffect, useRef } from 'preact/hooks';
import type { Preferences, ThemePreference } from '../../types';
import { POPUP_WIDTHS } from '../../lib/constants';

interface Props {
  prefs: Preferences;
  onUpdate: (patch: Partial<Preferences>) => void;
  onResetColumns: () => void;
  onExport: (format: 'csv' | 'json') => void;
  onHelp: () => void;
  onClose: () => void;
}

const THEMES: Array<[ThemePreference, string]> = [
  ['system', 'Auto'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function Menu({ prefs, onUpdate, onResetColumns, onExport, onHelp, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Element;
      // The ⋯ button toggles the menu itself.
      if (!ref.current?.contains(target) && !target.closest?.('.menu-button')) onClose();
    };
    // Defer so the click that opened the menu doesn't close it.
    const id = setTimeout(() => document.addEventListener('mousedown', onPointer));
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [onClose]);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div class="menu" ref={ref} role="menu" aria-label="Settings and tools">
      <div class="menu-row">
        <span class="menu-label">Theme</span>
        <div class="segmented" role="group" aria-label="Theme">
          {THEMES.map(([value, label]) => (
            <button
              key={value}
              class={prefs.theme === value ? 'on' : ''}
              aria-pressed={prefs.theme === value}
              onClick={() => onUpdate({ theme: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div class="menu-row">
        <span class="menu-label">Width</span>
        <div class="segmented" role="group" aria-label="Popup width">
          {(Object.entries(POPUP_WIDTHS) as Array<[string, number]>).map(([label, width]) => (
            <button
              key={label}
              class={prefs.popupWidth === width ? 'on' : ''}
              aria-pressed={prefs.popupWidth === width}
              title={`${width}px`}
              onClick={() => onUpdate({ popupWidth: width })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label class="menu-row menu-check">
        <input
          type="checkbox"
          checked={prefs.protectPinned}
          onChange={e => onUpdate({ protectPinned: (e.target as HTMLInputElement).checked })}
        />
        <span>Never bulk-close pinned tabs</span>
      </label>
      <hr />
      <button class="menu-item" role="menuitem" onClick={act(() => onExport('csv'))}>
        Export visible tabs as CSV
      </button>
      <button class="menu-item" role="menuitem" onClick={act(() => onExport('json'))}>
        Export visible tabs as JSON
      </button>
      <button class="menu-item" role="menuitem" onClick={act(onResetColumns)}>
        Reset column widths
      </button>
      <hr />
      <button class="menu-item" role="menuitem" onClick={act(onHelp)}>
        Help &amp; keyboard shortcuts <kbd>?</kbd>
      </button>
    </div>
  );
}
