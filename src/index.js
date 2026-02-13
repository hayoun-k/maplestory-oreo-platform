import { verifyKey } from 'discord-interactions';
import { handleCommand } from './bot/commands/index.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Discord interactions
    if (request.method === 'POST') {
      const signature = request.headers.get('x-signature-ed25519');
      const timestamp = request.headers.get('x-signature-timestamp');

      if (signature && timestamp) {
        const body = await request.clone().text();
        const isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
        
        if (!isValid) return new Response('Bad signature', { status: 401 });

        const interaction = JSON.parse(body);
        
        if (interaction.type === 1) {
          return new Response(JSON.stringify({ type: 1 }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        if (interaction.type === 2) {
          return handleCommand(interaction, env, ctx);
        }
      }
    }

    // Serve static Astro files
    try {
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
};