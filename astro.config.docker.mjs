// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// Config used only for Docker builds (npm run build:docker)
// Production deploy uses astro.config.mjs with the Vercel adapter
export default defineConfig({
  integrations: [react()],
  adapter: node({ mode: 'standalone' }),
});
