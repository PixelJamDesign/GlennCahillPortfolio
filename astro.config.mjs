import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://glenncahill.com',
  // the dev harness assigns a port via env when 4321 is taken (autoPort)
  server: { port: process.env.PORT ? Number(process.env.PORT) : 4321 },
  vite: {
    server: {
      watch: {
        // asset-packs holds gigabytes of game-art sources; letting the
        // watcher crawl it pegs the CPU and stalls dev-server startup
        ignored: ['**/asset-packs/**', '**/dist/**'],
      },
    },
  },
});
