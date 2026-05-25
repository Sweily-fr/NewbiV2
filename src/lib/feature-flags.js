/**
 * Feature flags — toggle in-development features without changing runtime defaults.
 *
 * Mirror of newbi-api/src/utils/featureFlags.js. Keep both in sync.
 *
 * Server-side only. Reads ENABLE_APP_TRIAL (not NEXT_PUBLIC_*) so the flag never
 * leaks to the client bundle. Components that need to react to the flag should
 * receive it through a server-rendered prop or a server API response.
 */

export function isAppTrialEnabled() {
  return process.env.ENABLE_APP_TRIAL === "true";
}
