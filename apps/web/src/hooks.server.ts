import { getAuth } from '@lerno/auth';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { getRequestEvent } from "$app/server"; // or from event

export const auth = getAuth(getRequestEvent);


const betterAuthHandle: Handle = async ({ event, resolve }) => {

  return svelteKitHandler({ event, resolve, auth, building });
};

const authStateHandle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session;
  event.locals.user = session?.user ?? null;

  // Route Protection Logic
  const isAppRoute = event.route.id?.startsWith('/(app)');
  const isOnboardingRoute = event.route.id === '/(app)/onboarding';

  if (isAppRoute) {
    if (!event.locals.user) {
      return new Response(null, { status: 302, headers: { Location: '/sign-in' } });
    }

    // Check if the user has completed onboarding (e.g. they have at least 1 course)
    // For now we'll allow /onboarding, but if they hit /(app) without setup, redirect
    // We will implement the actual DB check for active courses when we build completeOnboarding.
    // if (!userHasCourses && !isOnboardingRoute) {
    //   return new Response(null, { status: 302, headers: { Location: '/onboarding' } });
    // }
  }

  return resolve(event);
};

const securityHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
};

export const handle = sequence(betterAuthHandle, authStateHandle, securityHandle);
