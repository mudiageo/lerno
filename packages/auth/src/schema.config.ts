import { betterAuth } from 'better-auth';
import { createAuthOptions } from './index';

// The auth CLI only inspects options to generate the database schema. It does
// not need real credentials, so keep runtime secrets out of this config.
export const auth = betterAuth(
  createAuthOptions({
    baseURL: 'http://localhost:5173',
    secret: 'schema-generation-only-secret-not-used-at-runtime-000000000000',
    googleClientId: 'schema-generation',
    googleClientSecret: 'schema-generation',
  })
);
