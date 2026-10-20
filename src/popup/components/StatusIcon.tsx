import type { Staleness } from '../../types';
import { STATUS_DESCRIPTIONS, STATUS_LABELS } from '../../lib/constants';

/** Status shape (circle, diamond, square, cross) so status never relies on colour alone. */
export function StatusIcon({ status }: { status: Staleness }) {
  const label = `${STATUS_LABELS[status]}: ${STATUS_DESCRIPTIONS[status].toLowerCase()}`;
  return <span class={`status status-${status}`} role="img" aria-label={label} title={label} />;
}
