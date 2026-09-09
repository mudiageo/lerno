import adapterAuto from '@sveltejs/adapter-auto';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: { experimental: { async: true } },

      // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
      // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
      // See https://svelte.dev/docs/kit/adapters for more information about adapters.
      adapter: process.env.WORKERS_CI ? adapterCloudflare() : adapterAuto(),
      experimental: { remoteFunctions: true },
    }),
    devtoolsJson(),
  ],
});
