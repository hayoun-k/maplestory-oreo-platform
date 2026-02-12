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

export async function handleCommand(interaction, env, ctx) {
  const commandName = interaction.data.name;
  const commandHandler = commands[commandName];

  if (!commandHandler) {
    return createResponse('Unknown command!');
  }

  try {
    return await commandHandler(interaction, env, ctx);
  } catch (error) {
    console.error('Command error:', error);
    return createResponse('Sorry, something went wrong!');
  }
}

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

// New embed response function
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