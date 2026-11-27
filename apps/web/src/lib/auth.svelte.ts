import { createAuthClient } from 'better-auth/svelte';

// On the browser Better Auth defaults to the current origin. On the server we
// need an explicit URL, so deployments can provide VITE_PUBLIC_APP_URL.
const baseURL = import.meta.env.VITE_PUBLIC_APP_URL;

export const authClient = createAuthClient(baseURL ? { baseURL } : {});

export const { signIn, signOut, signUp, useSession } = authClient;
