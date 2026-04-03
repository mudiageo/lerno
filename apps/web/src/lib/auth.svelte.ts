import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_APP_URL || 'https://lerno.localhost',
});

export const { signIn, signOut, signUp, useSession } = authClient;
