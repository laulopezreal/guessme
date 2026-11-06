/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default mode for first-time players; they can switch at runtime. */
  readonly VITE_GAME_MODE?: 'classic' | 'ai';
  /** PostHog project key. Leave unset to disable analytics. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog ingestion host, e.g. https://eu.i.posthog.com */
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
