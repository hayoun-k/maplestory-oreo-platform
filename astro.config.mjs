import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://oreobot2025.hayoun-k-1102.workers.dev',
  // Set output to 'server' to enable SSR and access Cloudflare KV at runtime
  output: 'server',

  // Configure the Cloudflare adapter
  adapter: cloudflare({
    // Enables access to KV, vars, etc., during local development
    platformProxy: {
      enabled: true,
    },
    // Matches the runtime environment of your Cloudflare Worker/Pages
    runtime: {
      mode: 'local',
      type: 'worker',
    }
  }),

  // Optional: If your Astro files are nested in src/web
  srcDir: './src/web',
  publicDir: './public', // Points to root public dir if applicable
});