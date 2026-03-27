import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  run: {
    tasks: {
      'db:generate': { command: 'drizzle-kit generate' },
      'db:migrate': { command: 'drizzle-kit migrate' },
      'db:studio': { command: 'drizzle-kit studio' },
    },
  },
});
