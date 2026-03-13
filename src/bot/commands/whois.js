import { InteractionResponseType } from 'discord-interactions';
import { getMemberData } from '../../lib/storage.js';

/**
 * Configuration for Guild Officers
 */
const OFFICER_CONFIG = {
  roleIds: ['1402116762694062163'], //
};

export function whoisCommand(interaction, env, ctx) {
  ctx.waitUntil(processWhois(interaction, env));

  // Defer ephemerally when a webhook channel is configured so "thinking..." stays private
  return new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: env.BOT_CHANNEL_WEBHOOK ? { flags: 64 } : {}
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function processWhois(interaction, env) {
  const targetUserId = interaction.data.options?.[0]?.value;
  const requestingUserId = interaction.member.user.id;

  const followUpUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;

  if (!targetUserId) {
    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "⚠️ Missing User",
          description: "Please specify a Discord user to look up! Example: `/whois @username`",
          color: 0xFFC107
        }]
      })
    });
    return;
  }

  try {
    // 1. Retrieve the enriched member data from KV
    const memberData = await getMemberData(env.MEMBERS_KV, targetUserId);

    if (!memberData) {
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "🔍 Member Not Found",
            description: `<@${targetUserId}> is not registered in our directory. They can use \`/register [IGN]\` to join!`,
            color: 0xFF9800
          }]
        })
      });
      return;
    }

    // 2. Check for Officer Roles in Discord metadata
    let isOfficer = false;
    if (interaction.data.resolved?.members?.[targetUserId]) {
      const targetMember = interaction.data.resolved.members[targetUserId];
      isOfficer = targetMember.roles?.some(roleId => OFFICER_CONFIG.roleIds.includes(roleId));
    }

    // 3. Calculate status badges
    const registeredDate = new Date(memberData.registeredAt);
    const daysSinceRegistration = Math.floor((new Date() - registeredDate) / (1000 * 60 * 60 * 24));

    const badges = [];
    if (isOfficer) badges.push("👑 Guild Officer");
    if (daysSinceRegistration <= 7) badges.push("🆕 New Member");
    if (daysSinceRegistration >= 30) badges.push("🏆 Veteran");

    // 4. Construct the Profile Embed
    const embed = {
      title: `🎮 ${isOfficer ? 'Officer' : 'Member'} Profile`,
      description: `Information for <@${targetUserId}>`,
      color: isOfficer ? 0xFFD700 : 0x4CAF50,
      thumbnail: {
        url: memberData.imageUrl || "https://cdn.discordapp.com/embed/avatars/0.png"
      },
      fields: [
        {
          name: "🎯 MapleStory IGN",
          value: `**${memberData.ign}**`,
          inline: true
        },
        {
          name: "📊 Level",
          value: memberData.level ? String(memberData.level) : "N/A",
          inline: true
        },
        {
          name: "⚔️ Job",
          value: memberData.job || "Unknown",
          inline: true
        },
        {
          name: "📅 Member Since",
          value: `${registeredDate.toLocaleDateString()}\n*${daysSinceRegistration} days ago*`,
          inline: true
        }
      ],
      footer: {
        text: requestingUserId === targetUserId
          ? "This is your profile • Use /register to update"
          : "OreoBot • MapleStory Guild Assistant"
      },
      timestamp: new Date().toISOString()
    };

    if (badges.length > 0) {
      embed.fields.push({
        name: "🏅 Status",
        value: badges.join("\n"),
        inline: true
      });
    }

    if (env.BOT_CHANNEL_WEBHOOK) {
      await fetch(env.BOT_CHANNEL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "✅ Profile Posted",
            description: `Profile for **${memberData.ign}** has been posted to the bot channel.`,
            color: 0x4CAF50
          }]
        })
      });
    } else {
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    }

  } catch (error) {
    console.error('Error in whois command:', error);
    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "💥 Lookup Failed",
          description: "An error occurred while retrieving this profile.",
          color: 0xFF5722
        }]
      })
    });
  }
}
