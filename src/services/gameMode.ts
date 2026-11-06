export type GameMode = 'classic' | 'ai';

const STORAGE_KEY = 'guessme:mode';

/**
 * The mode a player starts in. A remembered choice wins; otherwise the
 * VITE_GAME_MODE default applies. Players can switch at runtime.
 */
export function getDefaultGameMode(): GameMode {
  return readStoredMode() ?? (import.meta.env.VITE_GAME_MODE === 'ai' ? 'ai' : 'classic');
}

export function rememberGameMode(mode: GameMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The choice just won't persist.
  }
}

function readStoredMode(): GameMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'ai' || value === 'classic' ? value : null;
  } catch {
    return null;
  }
}
