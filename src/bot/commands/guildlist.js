import { InteractionResponseType } from 'discord-interactions';
import { createEmbedResponse } from './index.js';
import { getAllMembers } from '../../lib/storage.js';

// The new, deferred-response implementation of the guild list command.
export function guildlistCommand(interaction, env, ctx) {
  // Immediately return a deferred response to Discord
  ctx.waitUntil(createAndSendGuildList(interaction, env));
  
  return new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createAndSendGuildList(interaction, env) {
  try {
    const members = await getAllMembers(env.MEMBERS_KV);
    let embed;

    if (members.length === 0) {
      embed = {
        title: "🏰 Guild Member Directory",
        description: "No members registered yet! Use `/register [ign]` to join.",
        color: 0x6C7B7F
      };
    } else {
      // Sort by Level (Highest first) then by IGN
      members.sort((a, b) => {
        if ((b.level || 0) !== (a.level || 0)) {
          return (b.level || 0) - (a.level || 0);
        }
        return a.ign.toLowerCase().localeCompare(b.ign.toLowerCase());
      });

      // Pagination Settings
      const maxMembersPerPage = 10;
      const totalPages = Math.ceil(members.length / maxMembersPerPage);
      const currentPage = 1; 
      const startIndex = (currentPage - 1) * maxMembersPerPage;
      const displayMembers = members.slice(startIndex, startIndex + maxMembersPerPage);
      
      const memberList = displayMembers.map((member, index) => {
        const rank = startIndex + index + 1;
        const levelStr = member.level ? `[Lv.${member.level}]` : '[??]';
        const jobStr = member.job ? ` - ${member.job}` : '';
        const legionStr = member.legionLevel != null ? ` ⚜️${member.legionLevel}` : '';
        return `\`${rank}.\` **${member.ign}** ${levelStr}${jobStr}${legionStr}\n└ <@${member.discordId}>`;
      }).join('\n\n');

      const avgLevel = Math.round(members.reduce((acc, m) => acc + (m.level || 0), 0) / members.length);
      const topMember = members[0];

      embed = {
        title: "🏰 Oreo Guild Roster",
        description: memberList,
        color: 0x4CAF50,
        thumbnail: {
          url: topMember.imageUrl || ""
        },
        fields: [
          {
            name: "📊 Guild Stats",
            value: `**Total:** ${members.length}\n**Avg Level:** ${avgLevel}`,
            inline: true
          },
          {
            name: "👑 Top Rank",
            value: `**${topMember.ign}**\nLv.${topMember.level || '???'}`,
            inline: true
          }
        ],
        footer: {
          text: `Page ${currentPage}/${totalPages} • Visit our site for the full gallery!`
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // Send the follow-up message
    const followUpUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

  } catch (error) {
    console.error('Error fetching guild list:', error);
    // Send an error follow-up
    const followUpUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "❌ Directory Unavailable",
          description: "Unable to load the roster. Please try again later.",
          color: 0xFF5722
        }]
      })
    });
  }
}