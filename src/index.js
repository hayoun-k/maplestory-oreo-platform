import bot from './bot/index.js';
// Note: You would typically use an Astro adapter here, but for a manual setup:
// import { manifest } from 'astro:ssr-manifest'; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route 1: Discord Interactions
    // You might want to restrict this to a specific path like /interaction to avoid conflicts
    if (request.method === 'POST' && request.headers.get('x-signature-ed25519')) {
      return bot.fetch(request, env, ctx);
    }

    // Route 2: API Proxy (To remove cors-anywhere dependency)
    if (url.pathname === '/api/character') {
      const ign = url.searchParams.get('name');
      const apiResponse = await fetch(`https://www.nexon.com/api/maplestory/no-auth/v1/ranking/na?type=overall&id=weekly&reboot_index=0&page_index=1&character_name=${ign}`);
      return apiResponse; // Forward the Nexon response directly
    }

    // Route 3: Website
    // For a simple worker, you might just return a static response or use the Astro SSR handler
    return new Response("Website integration requires Astro Cloudflare Adapter setup.", { status: 200 });
  },
  
  // Forward scheduled events to the bot
  async scheduled(event, env, ctx) {
    await bot.scheduled(event, env, ctx);
  }
};