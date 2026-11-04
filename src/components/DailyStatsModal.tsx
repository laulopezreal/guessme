import { streakAsOf, winRate } from '../services/dailyStats';
import type { DailyStats } from '../types';

interface DailyStatsModalProps {
  isVisible: boolean;
  stats: DailyStats;
  /** Today's UTC date key, used to decide whether the streak is still alive. */
  todayKey: string;
  onClose: () => void;
}

/** Every figure has five clues, so the chart always shows at least five rows. */
const DISTRIBUTION_ROWS = 5;

export default function DailyStatsModal({ isVisible, stats, todayKey, onClose }: DailyStatsModalProps) {
  if (!isVisible) return null;

  const rowCount = Math.max(DISTRIBUTION_ROWS, ...Object.keys(stats.distribution).map(Number));
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    clues: index + 1,
    count: stats.distribution[index + 1] ?? 0,
  }));
  const maxCount = Math.max(1, ...rows.map(row => row.count));
  const today = stats.results[todayKey];

  const todayLine = today
    ? today.won
      ? `Today: solved in ${today.cluesUsed} ${today.cluesUsed === 1 ? 'clue' : 'clues'} for ${today.score} points.`
      : 'Today: not solved. Tomorrow is a new day.'
    : "Today's puzzle is waiting for you.";

  return (
    <div className="modal">
      <div className="modal-content stats-modal">
        <h2 className="modal-title">Daily puzzle stats</h2>

        <dl className="stats-grid">
          <div className="stat-tile">
            <dt>Played</dt>
            <dd>{stats.played}</dd>
          </div>
          <div className="stat-tile">
            <dt>Win rate</dt>
            <dd>{winRate(stats)}%</dd>
          </div>
          <div className="stat-tile">
            <dt>Streak</dt>
            <dd>{streakAsOf(stats, todayKey)}</dd>
          </div>
          <div className="stat-tile">
            <dt>Best streak</dt>
            <dd>{stats.bestStreak}</dd>
          </div>
        </dl>

        <h3 className="stats-subtitle">Clues needed</h3>
        {stats.won === 0 ? (
          <p className="modal-text">Solve a puzzle and your clue counts show up here.</p>
        ) : (
          <ol className="stats-distribution" aria-label="Wins by clues needed">
            {rows.map(row => {
              const isToday = today?.won === true && today.cluesUsed === row.clues;
              return (
                <li key={row.clues} className="dist-row">
                  <span className="dist-label">{row.clues}</span>
                  <span className="dist-track">
                    <span
                      className={`dist-bar ${isToday ? 'dist-bar-today' : ''}`}
                      style={{ width: `${Math.max(10, (row.count / maxCount) * 100)}%` }}
                      aria-label={`${row.count} ${row.count === 1 ? 'win' : 'wins'} with ${row.clues} ${row.clues === 1 ? 'clue' : 'clues'}`}
                    >
                      {row.count}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <p className="stats-today">{todayLine}</p>

        <button className="modal-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
