import { Fragment, type ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from '../../lib/constants';
import { STATUS_ORDER } from '../../lib/status';
import { StatusIcon } from './StatusIcon';

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    return () => previous?.focus?.();
  }, []);
  return (
    <div class="overlay" onClick={onClose}>
      <div
        ref={ref}
        class={`modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export interface ConfirmRequest {
  message: string;
  detail?: string;
  actionLabel: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  request,
  onCancel,
}: {
  request: ConfirmRequest;
  onCancel: () => void;
}) {
  return (
    <Modal title={request.message} onClose={onCancel}>
      <p class="confirm-message">{request.message}</p>
      {request.detail && <p class="confirm-detail">{request.detail}</p>}
      <div class="confirm-actions">
        <button class="btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          class="btn btn-danger"
          data-autofocus
          onClick={() => {
            onCancel();
            request.onConfirm();
          }}
        >
          {request.actionLabel}
        </button>
      </div>
    </Modal>
  );
}

const SHORTCUTS: Array<[string, string]> = [
  ['↑ ↓  or  j k', 'Move between tabs'],
  ['Home / End', 'First / last tab'],
  ['Space', 'Select or deselect the focused tab'],
  ['Enter', 'Switch to the focused tab'],
  ['Delete', 'Close selected tabs (or the focused tab)'],
  ['⌘/Ctrl + A', 'Select all visible tabs'],
  ['⌘/Ctrl + Z', 'Undo the last close'],
  ['/  or  ⌘/Ctrl + F', 'Search'],
  ['Esc', 'Close dialog, then clear focus, search, selection'],
  ['?', 'Show this help'],
];

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help" onClose={onClose} wide>
      <div class="modal-header">
        <h2>Help</h2>
        <button class="icon-button" onClick={onClose} aria-label="Close help" title="Close (Esc)">
          ×
        </button>
      </div>
      <div class="help-body">
        <section>
          <h3>Status</h3>
          <ul class="legend-list">
            {STATUS_ORDER.map(s => (
              <li key={s}>
                <StatusIcon status={s} />
                <strong>{STATUS_LABELS[s]}</strong>
                <span>{STATUS_DESCRIPTIONS[s]}</span>
              </li>
            ))}
            <li>
              <span class="busy-dot" aria-hidden="true" />
              <strong>Busy</strong>
              <span>A background tab that made a network request in the last minute</span>
            </li>
          </ul>
        </section>
        <section>
          <h3>Columns</h3>
          <dl class="help-dl">
            <dt>Age</dt>
            <dd>
              How long the tab has been open. Chrome doesn't tell extensions when a tab was opened,
              so Autopsy records it and carries it across restarts. Tabs opened before Autopsy was
              installed show a minimum, like <em>≥3d</em>.
            </dd>
            <dt>Viewed</dt>
            <dd>When you last switched to the tab, as reported by Chrome.</dd>
            <dt>Network, Data</dt>
            <dd>
              Requests the tab made since Chrome started. Data counts only responses that report a
              size and weren't served from cache.
            </dd>
          </dl>
        </section>
        <section>
          <h3>Keyboard</h3>
          <dl class="shortcuts">
            {SHORTCUTS.map(([keys, action]) => (
              <Fragment key={keys}>
                <dt>
                  <kbd>{keys}</kbd>
                </dt>
                <dd>{action}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
        <p class="help-footer">
          Pinned tabs are skipped by bulk closes unless you turn off protection in the ⋯ menu.
          Everything stays on your device.
        </p>
      </div>
    </Modal>
  );
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div class="toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button class="link-button" onClick={onUndo}>
        Undo
      </button>
      <button class="icon-button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
