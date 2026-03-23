import { defineConfig } from 'vite-plus';

export default defineConfig({
    test: {
        include: ['**/*.test.ts'],
        coverage: { provider: 'v8' },
    },
    lint: {
        ignorePatterns: ['dist/**', '.svelte-kit/**', 'src-tauri/**'],
    },
    fmt: {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
    },
    run: {
        tasks: {
            'dev': { command: 'vp dev', cwd: 'apps/web' },
            'build:web': { command: 'vp build', cwd: 'apps/web' },
            'build:desktop': { command: 'tauri build', cwd: 'apps/desktop' },
            'build:android': { command: 'tauri android build', cwd: 'apps/desktop' },
            'db:generate': { command: 'drizzle-kit generate', cwd: 'packages/db' },
            'db:migrate': { command: 'drizzle-kit migrate', cwd: 'packages/db' },
            'db:studio': { command: 'drizzle-kit studio', cwd: 'packages/db' },
            'jobs:dev': { command: 'tsx watch src/worker.ts', cwd: 'packages/jobs' },
            'ui:add': { command: 'vpx shadcn-svelte@latest add', cwd: 'packages/ui' },
        },
    },
    staged: {
        '*.{ts,svelte}': 'vp check --fix',
        '*.{json,md,css}': 'vp fmt --fix',
    },
});