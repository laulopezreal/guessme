/**
 * Minimal product analytics.
 *
 * Events go to PostHog when VITE_POSTHOG_KEY is set, using cookieless
 * in-memory persistence so no consent banner is needed. Without a key,
 * events are logged to the console in development and dropped in production.
 */

type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, AnalyticsValue>;

interface PostHogClient {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, props?: AnalyticsProps) => void;
}

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = (import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com').replace(/\/$/, '');

let loading: Promise<PostHogClient | null> | null = null;

function loadPostHog(): Promise<PostHogClient | null> {
  if (!KEY || typeof document === 'undefined') return Promise.resolve(null);

  if (!loading) {
    loading = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = `${HOST}/static/array.js`;
      script.async = true;
      script.onload = () => {
        const client = window.posthog;
        if (!client) {
          resolve(null);
          return;
        }
        client.init(KEY, {
          api_host: HOST,
          persistence: 'memory',
          autocapture: false,
          capture_pageview: true,
          disable_session_recording: true,
        });
        resolve(client);
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  return loading;
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(KEY);
}

export function track(event: string, props?: AnalyticsProps): void {
  if (!KEY) {
    if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {});
    return;
  }
  void loadPostHog().then(client => client?.capture(event, props));
}
