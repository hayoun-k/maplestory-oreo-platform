import { createEmbedResponse } from './register.js';
import { getAllMembers } from '../../lib/storage.js';

export async function guildlistCommand(interaction, env) {
  try {
    const members = await getAllMembers(env.MEMBERS_KV);
    
    // 1. Handle Empty Directory
    if (members.length === 0) {
      return createEmbedResponse({
        title: "🏰 Guild Member Directory",
        description: "No members registered yet! Use `/register [ign]` to join.",
        color: 0x6C7B7F
      });
    }

    // 2. Sort by Level (Highest first) then by IGN
    members.sort((a, b) => {
      if ((b.level || 0) !== (a.level || 0)) {
        return (b.level || 0) - (a.level || 0);
      }
      return a.ign.toLowerCase().localeCompare(b.ign.toLowerCase());
    });

    // 3. Pagination Settings
    const maxMembersPerPage = 10; // Reduced for better mobile readability with more data
    const totalPages = Math.ceil(members.length / maxMembersPerPage);
    const currentPage = 1; 
    const startIndex = (currentPage - 1) * maxMembersPerPage;
    const displayMembers = members.slice(startIndex, startIndex + maxMembersPerPage);
    
    // 4. Create Detailed Member List
    // Now including Level and Job in the summary
    const memberList = displayMembers.map((member, index) => {
      const rank = startIndex + index + 1;
      const levelStr = member.level ? `[Lv.${member.level}]` : '[??]';
      const jobStr = member.job ? ` - ${member.job}` : '';
      return `\`${rank}.\` **${member.ign}** ${levelStr}${jobStr}\n└ <@${member.discordId}>`;
    }).join('\n\n');

    // 5. Calculate Statistics
    const avgLevel = Math.round(members.reduce((acc, m) => acc + (m.level || 0), 0) / members.length);
    const topMember = members[0];

    // 6. Build the Embed
    const embed = {
      title: "🏰 Oreo Guild Roster",
      description: memberList,
      color: 0x4CAF50,
      thumbnail: {
        url: topMember.imageUrl || "" // Show the highest level member's sprite as the guild "champion"
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
        text: `Page ${currentPage}/${totalPages} • Visit the website for the full card gallery!`
      },
      timestamp: new Date().toISOString()
    };

    return createEmbedResponse(embed);
    
  } catch (error) {
    console.error('Error fetching guild list:', error);
    return createEmbedResponse({
      title: "❌ Directory Unavailable",
      description: "Unable to load the roster. Please try again later.",
      color: 0xFF5722
    }, true);
  }
}