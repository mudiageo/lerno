import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_APP_URL || 'http://localhost:5173',
});

export const { signIn, signOut, signUp, useSession } = authClient;
