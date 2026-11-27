import { betterAuth, type Auth, type BetterAuthOptions } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@lerno/db';
import * as schema from '@lerno/db/schema';
import { email } from '@lerno/email';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuthConfig {
  baseURL?: string;
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  adminAppUrl?: string;
}

export function createAuthOptions(config: AuthConfig): BetterAuthOptions {
  return {
    // Deployment-provided origin. Without it Better Auth would generate
    // callback URLs pointing at localhost on Vercel/Cloudflare.
    baseURL: config.baseURL,
    secret: config.secret,
    database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }: any) => {
        await email.send({
          to: user.email,
          subject: 'Reset your Lerno password',
          html: `Reset your password here: ${url}`,
        });
      },
    },

    emailVerification: {
      sendVerificationEmail: async ({ user, url }: any) => {
        await email.send({
          to: user.email,
          subject: 'Verify your Lerno email',
          html: `Verify your email here: ${url}`,
        });
      },
    },

    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh if older than 1 day
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },

    user: {
      fields: {
        name: 'displayName',
        image: 'avatarUrl',
      },
      additionalFields: {
        username: { type: 'string', required: true },
        bio: { type: 'string' },
        plan: { type: 'string', defaultValue: 'free' },
        aiEnabled: { type: 'boolean', defaultValue: true },
        theme: { type: 'string', defaultValue: 'system' },
        dyslexiaFont: { type: 'boolean', defaultValue: false },
        reducedMotion: { type: 'boolean', defaultValue: false },
        streakDays: { type: 'number', defaultValue: 0 },
        xp: { type: 'number', defaultValue: 0 },
        lastActiveDate: { type: 'date' },
        referralCode: { type: 'string' },
        referredBy: { type: 'string' },
        institutionId: { type: 'string' },
      },
    },

    plugins: [
      // Role-based access control plugin setup
      {
        id: 'rbac',
        hooks: {
          after: [
            {
              matcher: (ctx: any) => ctx.path === '/sign-in/email',
              handler: createAuthMiddleware(async (ctx) => {
                // Redirect staff to admin app, students to web app
                const user = ctx.context.newSession?.user as any;
                if (
                  user &&
                  [
                    'superadmin',
                    'staff_admin',
                    'moderator',
                    'support',
                    'analyst',
                    'finance',
                  ].includes(user.role) &&
                  config.adminAppUrl
                ) {
                  return Response.redirect(
                    `${config.adminAppUrl.replace(/\/$/, '')}/dashboard`,
                    302
                  );
                }
              }),
            },
          ],
        },
      },
    ],
  };
}

// Type-only declaration so consumers can infer Session/User without creating
// a runtime Better Auth instance in this package.
declare const typedAuth: Auth<BetterAuthOptions>;

export type Session = typeof typedAuth.$Infer.Session;
export type User = typeof typedAuth.$Infer.Session.user;

export const getAuth = (
  getRequestEvent: () => RequestEvent,
  config: AuthConfig
): Auth<BetterAuthOptions> => {
  const options = createAuthOptions(config);
  return betterAuth({
    ...options,
    plugins: [...(options.plugins ?? []), sveltekitCookies(getRequestEvent)],
  });
};

export * from './rbac';
export * from './audit';
