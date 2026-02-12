import { createEmbedResponse } from './index.js';
import { getMemberData } from '../../lib/storage.js';

/**
 * Configuration for Guild Officers
 */
const OFFICER_CONFIG = {
  roleIds: ['1402116762694062163'], //
};

export async function whoisCommand(interaction, env) {
  const targetUserId = interaction.data.options?.[0]?.value;
  const requestingUserId = interaction.member.user.id;
  
  if (!targetUserId) {
    return createEmbedResponse({
      title: "⚠️ Missing User",
      description: "Please specify a Discord user to look up! Example: `/whois @username`",
      color: 0xFFC107
    }, true);
  }

  try {
    // 1. Retrieve the enriched member data from KV
    const memberData = await getMemberData(env.MEMBERS_KV, targetUserId);
    
    if (!memberData) {
      return createEmbedResponse({
        title: "🔍 Member Not Found",
        description: `<@${targetUserId}> is not registered in our directory. They can use \`/register [IGN]\` to join!`,
        color: 0xFF9800
      }, true);
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

    // 4. Construct the Profile Embed using shared data
    const embed = {
      title: `🎮 ${isOfficer ? 'Officer' : 'Member'} Profile`,
      description: `Information for <@${targetUserId}>`,
      color: isOfficer ? 0xFFD700 : 0x4CAF50,
      // Use the character image URL fetched and saved during registration
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

    return createEmbedResponse(embed, false);

  } catch (error) {
    console.error('Error in whois command:', error);
    return createEmbedResponse({
      title: "💥 Lookup Failed",
      description: "An error occurred while retrieving this profile.",
      color: 0xFF5722
    }, true);
  }
}