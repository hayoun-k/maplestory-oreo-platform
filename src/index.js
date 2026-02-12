import { verifyKey } from 'discord-interactions';
import { handleCommand } from './bot/commands/index.js';
import { sendWeeklyReminder } from './bot/scheduled/bossReminder.js';
// @ts-ignore
import { handle as astroHandler } from '@astrojs/cloudflare/handler'; 

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Only process Discord interactions if it's a POST with headers
    // This prevents trying to parse signatures on standard GET / requests
    if (request.method === 'POST') {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');

      if (signature && timestamp) {
        const body = await request.clone().text();
        const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
        
        if (!isValidRequest) {
          return new Response('Bad request signature', { status: 401 });
        }

        const interaction = JSON.parse(body);
        if (interaction.type === 1) return new Response(JSON.stringify({ type: 1 }));
        if (interaction.type === 2) return await handleCommand(interaction, env, ctx);
      }
    }

    // 2. Hand off to Astro
    // Ensure the original request is passed cleanly to the handler
    try {
      return await astroHandler(request, env, ctx);
    } catch (e) {
      // Improved error reporting for the browser
      return new Response(`Astro Handler Error: ${e.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },

  async scheduled(event, env, ctx) {
    if (event.cron === '0 0 * * 4') { // Every Thursday at midnight UTC
      await sendWeeklyReminder(env);
    }
  }
};