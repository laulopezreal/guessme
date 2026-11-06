import type { DailyRecord, DailyStats } from '../types';
import { shiftDateKey } from '../utils/gameUtils';

/** Versioned so the shape can change later without misreading old data. */
export const DAILY_STATS_KEY = 'guessme:daily-stats:v1';

/** Finished puzzles kept per player; older ones are dropped. */
const MAX_RESULTS = 400;

export function emptyDailyStats(): DailyStats {
  return {
    version: 1,
    played: 0,
    won: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayed: null,
    distribution: {},
    results: {},
  };
}

function isDailyStats(value: unknown): value is DailyStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Partial<DailyStats>;
  return (
    stats.version === 1 &&
    typeof stats.played === 'number' &&
    typeof stats.won === 'number' &&
    typeof stats.currentStreak === 'number' &&
    typeof stats.bestStreak === 'number' &&
    typeof stats.distribution === 'object' && stats.distribution !== null &&
    typeof stats.results === 'object' && stats.results !== null
  );
}

export function loadDailyStats(): DailyStats {
  try {
    const raw = localStorage.getItem(DAILY_STATS_KEY);
    if (!raw) return emptyDailyStats();
    const parsed: unknown = JSON.parse(raw);
    return isDailyStats(parsed) ? parsed : emptyDailyStats();
  } catch {
    return emptyDailyStats();
  }
}

/** Returns false when storage is unavailable (private mode, blocked site data); the stats then last for this visit only. */
export function saveDailyStats(stats: DailyStats): boolean {
  try {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
    return true;
  } catch {
    return false;
  }
}

export function getDailyResult(stats: DailyStats, dateKey: string): DailyRecord | undefined {
  return stats.results[dateKey];
}

/**
 * Adds a finished puzzle. A day that is already recorded is left untouched,
 * so a replay cannot pad the numbers. A win the day after the last recorded
 * win extends the streak; a loss ends it; a skipped day starts over.
 */
export function recordDailyResult(stats: DailyStats, record: DailyRecord): DailyStats {
  if (stats.results[record.dateKey]) return stats;

  const continuesStreak = stats.currentStreak > 0 && stats.lastPlayed === shiftDateKey(record.dateKey, -1);
  const currentStreak = record.won ? (continuesStreak ? stats.currentStreak + 1 : 1) : 0;

  const distribution = { ...stats.distribution };
  if (record.won) {
    distribution[record.cluesUsed] = (distribution[record.cluesUsed] ?? 0) + 1;
  }

  const results = { ...stats.results, [record.dateKey]: record };
  const keys = Object.keys(results).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_RESULTS))) {
    delete results[key];
  }

  return {
    ...stats,
    played: stats.played + 1,
    won: stats.won + (record.won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastPlayed: record.dateKey,
    distribution,
    results,
  };
}

/** The streak as seen on `todayKey`: it stays alive until a whole day is missed. */
export function streakAsOf(stats: DailyStats, todayKey: string): number {
  if (!stats.lastPlayed) return 0;
  const keepsStreak = stats.lastPlayed === todayKey || stats.lastPlayed === shiftDateKey(todayKey, -1);
  return keepsStreak ? stats.currentStreak : 0;
}

/** Wins as a whole-number percentage of games played. */
export function winRate(stats: DailyStats): number {
  return stats.played === 0 ? 0 : Math.round((stats.won / stats.played) * 100);
}

/**
 * Notes how many questions the player has put to the day's figure after the
 * reveal, so the allowance survives a reload. Returns the same stats when the
 * day has no result yet or the count is unchanged.
 */
export function setDailyQuestionsAsked(stats: DailyStats, dateKey: string, questionsAsked: number): DailyStats {
  const record = stats.results[dateKey];
  if (!record || (record.questionsAsked ?? 0) === questionsAsked) return stats;
  return {
    ...stats,
    results: { ...stats.results, [dateKey]: { ...record, questionsAsked } },
  };
}
