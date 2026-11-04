import type { DailyProgress } from '../types';

/** Versioned like the stats, so a shape change can discard old entries safely. */
export const DAILY_PROGRESS_KEY = 'guessme:daily-progress:v1';

function isDailyProgress(value: unknown): value is DailyProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<DailyProgress>;
  return (
    progress.version === 1 &&
    typeof progress.dateKey === 'string' &&
    Array.isArray(progress.revealed) &&
    progress.revealed.every(entry => typeof entry?.text === 'string' && typeof entry?.adaptive === 'boolean') &&
    typeof progress.misses === 'number'
  );
}

/** The unfinished round saved for `dateKey`, or null when there is none or it belongs to another day. */
export function loadDailyProgress(dateKey: string): DailyProgress | null {
  try {
    const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDailyProgress(parsed) && parsed.dateKey === dateKey ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDailyProgress(progress: DailyProgress): void {
  try {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode, blocked site data): the round just will not survive a reload.
  }
}

export function clearDailyProgress(): void {
  try {
    localStorage.removeItem(DAILY_PROGRESS_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
