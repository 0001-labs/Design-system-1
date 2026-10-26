import { parseBatch, type FeedbackBatch } from './events';

/** Only error diagnostics survive a reload; never persist usage or recordings.
 * Delivery is at least once. Owner Issues deduplicate the original event identity.
 */
export function errorOutbox(product: string, send: (batch: FeedbackBatch) => Promise<boolean>, storage?: Storage) {
  const key = `feedback-loop:errors:${product}`;
  let pending: FeedbackBatch[] = [];
  let sending = false;
  let stopped = false;
  const recent = (batch: FeedbackBatch) => batch.events.every(e => e.at > Date.now() - 7 * 86400_000);
  const save = () => { try { storage?.setItem(key, JSON.stringify(pending)); } catch {} };
  try {
    const stored = JSON.parse(storage?.getItem(key) || '[]');
    if (Array.isArray(stored)) pending = stored.slice(-20).map(b => parseBatch(b)).filter(b => b.product === product && recent(b) && b.events.every(e => e.kind === 'error'));
  } catch {}
  return {
    add(batch: FeedbackBatch) {
      if (stopped) return;
      const events = batch.events.filter(e => e.kind === 'error');
      if (!events.length) return;
      pending.push({ ...batch, events });
      pending = pending.filter(recent).slice(-20);
      save();
    },
    async flush() {
      if (sending || stopped) return;
      sending = true;
      try {
        pending = pending.filter(recent);
        for (const batch of [...pending]) {
          if (stopped) break;
          let accepted = false;
          try { accepted = await send(batch); } catch {}
          if (!accepted) break;
          pending = pending.filter(b => b !== batch);
          save();
        }
      } finally { sending = false; }
    },
    stop(clear = false) {
      stopped = true;
      if (clear) { pending = []; try { storage?.removeItem(key); } catch {} }
    },
  };
}
