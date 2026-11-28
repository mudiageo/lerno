import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import * as v from 'valibot';

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
    schema: building ? v.optional(v.string(), '') : v.pipe(v.string(), v.url()),
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
    description: 'GitHub Client Secret for OAuth login (legacy demo only)',
  },
  GOOGLE_CLIENT_ID: {
    schema: building ? v.optional(v.string(), '') : v.string(),
    description: 'Google Client ID for OAuth login',
  },
  GOOGLE_CLIENT_SECRET: {
    schema: building ? v.optional(v.string(), '') : v.string(),
    description: 'Google Client Secret for OAuth login',
  },
  ADMIN_APP_URL: {
    schema: v.optional(v.string(), ''),
    description: 'Public URL of the admin app for staff redirects',
  },
  JOBS_SERVICE_URL: {
    schema: v.optional(v.string(), ''),
    description: 'Base URL of the Node pg-boss enqueue service (Vercel fallback)',
  },
  DATABASE_URL: {
    schema: building ? v.optional(v.string(), '') : v.string(),
    description: 'Connection string for the Postgres database',
  },
  VITE_PUBLIC_FIREBASE_API_KEY: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Public Firebase web API key for AI Logic',
  },
  VITE_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Public Firebase auth domain for AI Logic',
  },
  VITE_PUBLIC_FIREBASE_PROJECT_ID: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Public Firebase project ID for AI Logic',
  },
  VITE_PUBLIC_FIREBASE_APP_ID: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Public Firebase web app ID for AI Logic',
  },
  VITE_PUBLIC_FIREBASE_APPCHECK_SITE_KEY: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Public reCAPTCHA v3 site key for Firebase App Check',
  },
  VITE_PUBLIC_FIREBASE_APPCHECK_DEBUG: {
    public: true,
    schema: v.optional(v.string(), ''),
    description: 'Set to true only in local dev to use the App Check debug provider',
  },
});
