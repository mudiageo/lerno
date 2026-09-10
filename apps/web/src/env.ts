import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import * as v from 'valibot';

const value = (v: string | Promise<string>) => v.pipeAsync(v.unknown(), v.transformAsync(() => v));

export const variables = defineEnvVars({
  LIVEKIT_API_KEY: {
    schema: v.optional(v.string(), 'devkey'),
    description: 'API Key for LiveKit',
  },
  LIVEKIT_API_SECRET: {
    schema: v.optional(v.string(), 'secret'),
    description: 'API Secret for LiveKit',
  },
  LIVEKIT_URL: {
    schema: v.optional(v.string(), 'wss://localhost:7880'),
    description: 'LiveKit Server URL',
  },
  ORIGIN: {
    schema: building ? v.optional(v.pipe(v.string(), v.url()), '') : v.pipe(v.string(), v.url()),
    description: 'The public-facing origin of the application',
  },
  BETTER_AUTH_SECRET: {
    schema: building ? v.optional(v.string(), '') : v.string(),
    description: 'Secret key for Better Auth',
  },
  GITHUB_CLIENT_ID: {
    schema: v.optional(v.string(), ''),
    description: 'GitHub Client ID for OAuth login',
  },
  GITHUB_CLIENT_SECRET: {
    schema: v.optional(v.string(), ''),
    description: 'GitHub Client Secret for OAuth login',
  },
  DATABASE_URL: {
    schema: building ? v.optional(v.string(), '') : v.string(),
    description: 'Connection string for the Postgres database',
  },
});
