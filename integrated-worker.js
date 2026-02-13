/**
 * INTEGRATED WORKER - Discord Bot + Astro Web
 *
 * This worker combines:
 * 1. Discord bot interaction handling
 * 2. Astro web application (SSR)
 *
 * Discord POST requests → Discord bot handlers
 * Everything else → Astro
 */

import { verifyKey } from 'discord-interactions';
import { handleCommand } from './src/bot/commands/index.js';
import astroWorker from './dist/web/_worker.js/index.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);

    // Handle Discord interactions (POST with Discord signatures)
    if (request.method === 'POST') {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');

      if (signature && timestamp) {
        console.log('Discord interaction detected');

        const body = await request.clone().text();
        const isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

        if (!isValid) {
          console.log('Invalid Discord signature');
          return new Response('Bad request signature', { status: 401 });
        }

        const interaction = JSON.parse(body);
        console.log('Interaction type:', interaction.type, 'Command:', interaction.data?.name);

        // Handle PING (Discord's verification request)
        if (interaction.type === 1) {
          console.log('Responding to Discord PING');
          return new Response(JSON.stringify({ type: 1 }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Handle APPLICATION COMMAND
        if (interaction.type === 2) {
          return handleCommand(interaction, env, ctx);
        }

        return new Response(JSON.stringify({
          type: 4,
          data: { content: 'Unknown interaction type' }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Everything else goes to Astro
    console.log('Passing request to Astro');
    return astroWorker.fetch(request, env, ctx);
  }
};
