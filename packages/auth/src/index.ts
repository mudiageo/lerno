import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@lerno/db';
import * as schema from '@lerno/db/schema';
import { email } from '@lerno/email';
import type { RequestEvent } from '@sveltejs/kit';

export const authOptions: BetterAuthOptions = {
  database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
  advanced: {
    database: {
      generateId: () => crypto.randomUUID()
    }
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,     // 30 days
    updateAge: 60 * 60 * 24,           // refresh if older than 1 day
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
              if (user && ['superadmin', 'staff_admin', 'moderator', 'support', 'analyst', 'finance']
                .includes(user.role)) {
                return Response.redirect(`${process.env.ADMIN_APP_URL}/dashboard`, 302);
              }
            }),
          },
        ],
      },
    },
  ],
};

export const auth = betterAuth(authOptions);

export const getAuth = (getRequestEvent: () => RequestEvent): typeof auth => {
  return betterAuth({
    ...authOptions,
    plugins: [
      ...(authOptions.plugins as []),
      sveltekitCookies(getRequestEvent)
    ]
  });
};

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

export * from './rbac';
export * from './audit';
