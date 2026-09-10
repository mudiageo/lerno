import adapter from '@sveltejs/adapter-auto';
import { relative, sep } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // defaults to rune mode for the project, execept for `node_modules`. Can be removed in svelte 6.
        runes: ({ filename }) => {
          const relativePath = relative(import.meta.dirname, filename);
          const pathSegments = relativePath.toLowerCase().split(sep);
          const isExternalLibrary = pathSegments.includes('node_modules');

          return isExternalLibrary ? undefined : true;
        },
      },
      vitePlugin: {
        dynamicCompileOptions: ({ filename }) =>
          filename.includes('node_modules') ? undefined : { runes: true },
      },

      // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
      // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
      // See https://svelte.dev/docs/kit/adapters for more information about adapters.
      adapter: adapter(),
    }),
  ],
});
