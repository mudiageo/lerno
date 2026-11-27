import {
  ADMIN_APP_URL,
  BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  ORIGIN,
} from '$app/env/private';
import { building } from '$app/env';
import { getAuth } from '@lerno/auth';
import { getRequestEvent } from '$app/server';

// Better Auth validates its secret when constructed. Cloudflare build workers
// do not receive runtime secrets, so use a build-only placeholder during route
// analysis; the real secret is supplied by SvelteKit private env at runtime.
const buildOnlySecret = 'build-only-placeholder-secret-not-used-at-runtime-0000000000000000';

// Single server-side Better Auth instance for the web app.
// The shared @lerno/auth config owns the Google provider, schema and RBAC.
export const auth = getAuth(getRequestEvent, {
  baseURL: ORIGIN,
  secret: BETTER_AUTH_SECRET || (building ? buildOnlySecret : ''),
  googleClientId: GOOGLE_CLIENT_ID,
  googleClientSecret: GOOGLE_CLIENT_SECRET,
  adminAppUrl: ADMIN_APP_URL,
});
