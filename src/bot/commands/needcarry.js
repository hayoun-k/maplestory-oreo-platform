import { createResponse, createEmbedResponse } from './index.js';
import { getMemberData } from '../../lib/storage.js';

export async function needcarryCommand(interaction, env) {
  const userId = interaction.member.user.id;
  const username = interaction.member.user.username;
  const userAvatar = interaction.member.user.avatar;
  const boss = interaction.data.options?.[0]?.value;
  const notes = interaction.data.options?.[1]?.value || '';

  // Missing boss validation
  if (!boss) {
    const embed = {
      title: "⚠️ Missing Boss Name",
      description: "Please specify which boss you need help with!",
      color: 0xFFC107,
      fields: [
        {
          name: "💡 Example Usage",
          value: "`/needcarry Normal Zakum`\n`/needcarry Chaos Horntail Need help clearing`",
          inline: false
        }
      ],
      footer: {
        text: "OreoBot • MapleStory Guild Assistant"
      },
      timestamp: new Date().toISOString()
    };
    return createEmbedResponse(embed, true);
  }

  try {
    // Check if user is registered
    const memberData = await getMemberData(env.MEMBERS_KV, userId);
    
    if (!memberData) {
      const embed = {
        title: "❌ Registration Required",
        description: "You need to register your MapleStory IGN before requesting carries!",
        color: 0xFF5722,
        fields: [
          {
            name: "📝 How to Register",
            value: "Use `/register [your_ign]` to add yourself to the guild directory",
            inline: false
          },
          {
            name: "❓ Why Register?",
            value: "Registration helps guild members know who they're helping and makes it easier to coordinate in-game!",
            inline: false
          }
        ],
        footer: {
          text: "Register first, then try /needcarry again"
        },
        timestamp: new Date().toISOString()
      };
      return createEmbedResponse(embed, true);
    }
    
    // Get user avatar URL
    const avatarUrl = userAvatar 
      ? `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    // Create the carry request embed (simple, no boss-specific info)
    const carryRequestEmbed = {
      title: `⚔️ Carry Request: ${boss}`,
      description: `<@${userId}> needs help with **${boss}**!`,
      color: 0x2196F3, // Blue color for all carry requests
      thumbnail: {
        url: avatarUrl
      },
      fields: [
        {
          name: "👤 Requester",
          value: `**Discord:** <@${userId}>\n**MapleStory IGN:** ${memberData.ign}`,
          inline: true
        },
        {
          name: "⚔️ Boss",
          value: `**${boss}**`,
          inline: true
        },
        {
          name: "📅 Requested",
          value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: true
        }
      ],
      footer: {
        text: "React with ✋ to volunteer • Mark ✅ when completed"
      },
      timestamp: new Date().toISOString()
    };

    // Add notes field if provided
    if (notes) {
      carryRequestEmbed.fields.push({
        name: "📝 Additional Notes",
        value: notes,
        inline: false
      });
    }

    // Add helpful tips field
    carryRequestEmbed.fields.push({
      name: "💡 Tips for Helpers",
      value: "• Add them as a friend in MapleStory\n• Coordinate in guild chat or DMs\n• Mark as complete when done to help track activity",
      inline: false
    });

    // Try to send to webhook if configured
    const webhookUrl = env.CARRY_CHANNEL_WEBHOOK;
    
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [carryRequestEmbed],
            content: `🆘 **New Carry Request** - <@${userId}> needs help!`
          })
        });
        
        if (webhookResponse.ok) {
          // Success confirmation to user (ephemeral)
          const confirmationEmbed = {
            title: "✅ Carry Request Posted!",
            description: `Your request for **${boss}** has been posted to the carry channel!`,
            color: 0x4CAF50,
            fields: [
              {
                name: "⏰ What's Next?",
                value: "• Guild members will see your request\n• They can volunteer to help\n• Check the carry channel for responses\n• Be ready to coordinate with helpers!",
                inline: false
              },
              {
                name: "🎮 Your Info",
                value: `**MapleStory IGN:** ${memberData.ign}\n**Boss:** ${boss}${notes ? `\n**Notes:** ${notes}` : ''}`,
                inline: false
              }
            ],
            footer: {
              text: "Good luck with your boss run!"
            },
            timestamp: new Date().toISOString()
          };
          return createEmbedResponse(confirmationEmbed, true);
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Fall through to posting in current channel
      }
    }
    
    // Fallback: Post in current channel if webhook not configured or failed
    const fallbackEmbed = {
      title: "✅ Carry Request Created!",
      description: "Since no carry channel is configured, here's your request:",
      color: 0x2196F3,
      fields: [
        {
          name: "📋 Your Request",
          value: `${carryRequestEmbed.description}\n\n**Boss:** ${boss}\n**IGN:** ${memberData.ign}${notes ? `\n**Notes:** ${notes}` : ''}`,
          inline: false
        },
        {
          name: "💡 Tip for Guild Officers",
          value: "Set up a carry channel webhook with the environment variable `CARRY_CHANNEL_WEBHOOK` to automatically post requests to a dedicated channel!",
          inline: false
        }
      ],
      footer: {
        text: "Guild members can respond here or in guild chat"
      },
      timestamp: new Date().toISOString()
    };
    
    return createEmbedResponse(fallbackEmbed, false);
    
  } catch (error) {
    console.error('Error posting carry request:', error);
    
    const errorEmbed = {
      title: "💥 Request Failed",
      description: "Something went wrong while posting your carry request.",
      color: 0xFF5722,
      fields: [
        {
          name: "🔧 What to try",
          value: "• Make sure you're registered with `/register`\n• Wait a moment and try again\n• Contact a guild officer if the problem persists",
          inline: false
        },
        {
          name: "📝 Technical Details",
          value: `\`\`\`${error.message || 'Unknown error occurred'}\`\`\``,
          inline: false
        }
      ],
      footer: {
        text: "Error logged • Please try again in a few moments"
      },
      timestamp: new Date().toISOString()
    };
    
    return createEmbedResponse(errorEmbed, true);
  }
}