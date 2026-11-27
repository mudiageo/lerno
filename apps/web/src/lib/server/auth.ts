import { getAuth } from '@lerno/auth';
import { getRequestEvent } from '$app/server';

// Single server-side Better Auth instance for the web app.
// The shared @lerno/auth config owns the Google provider, schema and RBAC.
export const auth = getAuth(getRequestEvent);
