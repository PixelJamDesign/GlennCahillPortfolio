import { defineConfig } from 'astro/config';
import remarkSectionize from 'remark-sectionize';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import publish from './scripts/publish-plugin.mjs';
import generate from './scripts/generate-plugin.mjs';

// The visual editor (/keystatic) and the Publish page (/publish) only exist on
// the dev server running on the Pi. A production build leaves them out, so the
// public site stays plain static files with no editor attached.
const isBuild = process.argv.includes('build');

export default defineConfig({
  site: 'https://glenncahill.com',
  integrations: isBuild ? [] : [react(), keystatic()],
  // each ## heading in a case study becomes its own <section>: the journey
  // template lays those out as full-screen chapters
  markdown: { remarkPlugins: [remarkSectionize] },
  // old case study URLs, kept working after the files were renamed
  redirects: {
    '/work/bite-insight---health-app': '/work/bite-insight',
    '/work/euro-2020---tournament-app': '/work/euro-2020-tournament-app',
  },
  // the dev server runs on the Pi; expose it on the LAN so the Mac can preview it
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
  },
  vite: {
    plugins: [publish(), generate()],
    // pre-bundle the editor's UI up front; left to on-demand discovery, its
    // CommonJS dependencies (lodash and friends) load unconverted and the
    // editor renders a blank page
    // (@keystatic/astro itself must stay out: it imports Astro-only virtual
    // modules that the pre-bundler can't resolve, which breaks the restart)
    optimizeDeps: isBuild ? {} : { include: ['@keystatic/core', '@keystatic/core/ui'], exclude: ['@keystatic/astro'] },
    server: {
      // the editor is reached through the Cloudflare tunnel at this address
      allowedHosts: ['edit.glenncahill.com'],
      // Cloudflare caches .css/.js by extension unless the origin says not
      // to, so a preview through the tunnel could pair new HTML with a stale
      // stylesheet
      headers: { 'Cache-Control': 'no-store' },
      watch: {
        // asset-packs holds gigabytes of game-art sources; letting the
        // watcher crawl it pegs the CPU and stalls dev-server startup
        ignored: ['**/asset-packs/**', '**/dist/**'],
      },
    },
  },
});
