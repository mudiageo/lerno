import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  fmt: {
    useTabs: true,
    singleQuote: true,
    trailingComma: 'none',
    printWidth: 100,
    sortTailwindcss: {
      stylesheet: './src/routes/layout.css',
    },
    sortPackageJson: false,
    ignorePatterns: [
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'bun.lock',
      'bun.lockb',
      '/static/',
    ],
  },
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
});
