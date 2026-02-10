/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { verifyKey } from 'discord-interactions';
import { handleCommand } from './commands/index.js';
import { sendWeeklyReminder } from './scheduled/bossReminder.js';

export default {
  async fetch(request, env, ctx) {
    // Handle Discord interactions
    if (request.method === 'POST') {
      return await handleDiscordInteraction(request, env);
    }
    
    // Simple health check
    return new Response('MapleStory Guild Bot is running!');
  },

  // Scheduled function for weekly boss reminders
  async scheduled(event, env, ctx) {
    if (event.cron === '0 0 * * 4') { // Every Thursday at midnight UTC
      await sendWeeklyReminder(env);
    }
  }
};

async function handleDiscordInteraction(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  // Verify request is from Discord
  const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return new Response('Bad request signature', { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Handle ping from Discord
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle slash commands
  if (interaction.type === 2) {
    return await handleCommand(interaction, env);
  }

  return new Response('Unknown interaction type', { status: 400 });
}