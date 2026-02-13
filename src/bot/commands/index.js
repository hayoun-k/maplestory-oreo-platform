import { InteractionResponseType } from 'discord-interactions';
import { registerCommand } from './register.js';
import { whoisCommand } from './whois.js';
import { needcarryCommand } from './needcarry.js';
import { guildlistCommand } from './guildlist.js';

const commands = {
  'register': registerCommand,
  'whois': whoisCommand,
  'needcarry': needcarryCommand,
  'guildlist': guildlistCommand
};

// CRITICAL FIX: Remove 'async' keyword!
// Commands now return synchronous deferred responses, so we don't need async here
export function handleCommand(interaction, env, ctx) {
  const commandName = interaction.data.name;
  const commandHandler = commands[commandName];

  if (!commandHandler) {
    return createResponse('Unknown command!');
  }

  try {
    // Don't await - commands return immediately with deferred responses
    return commandHandler(interaction, env, ctx);
  } catch (error) {
    console.error('Command error:', error);
    return createResponse('Sorry, something went wrong!');
  }
}

// Legacy response function - still used for immediate ephemeral messages
export function createResponse(content, ephemeral = false) {
  return new Response(JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: ephemeral ? 64 : 0
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Legacy embed response function - still used for immediate ephemeral embeds
export function createEmbedResponse(embed, ephemeral = false) {
  return new Response(JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      flags: ephemeral ? 64 : 0
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}