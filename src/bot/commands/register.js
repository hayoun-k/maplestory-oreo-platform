import { InteractionResponseType } from 'discord-interactions';
import { setMemberData, getMemberData } from '../../lib/storage.js';
import { getCharacterData, getLegionLevel } from '../../lib/maple-api.js';

export function registerCommand(interaction, env, ctx) {
  // IMMEDIATELY return a deferred response to Discord
  ctx.waitUntil(processRegistration(interaction, env));

  // Defer ephemerally when a webhook channel is configured so "thinking..." stays private
  return new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: env.BOT_CHANNEL_WEBHOOK ? { flags: 64 } : {}
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function processRegistration(interaction, env) {
  const userId = interaction.member.user.id;
  const ign = interaction.data.options?.[0]?.value;
  const username = interaction.member.user.username;

  // Prepare the follow-up URL
  const followUpUrl = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;

  try {
    // 1. Basic IGN Validation
    if (!ign || ign.length < 2 || ign.length > 12 || !/^[a-zA-Z0-9]+$/.test(ign)) {
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "❌ Invalid IGN",
            description: "MapleStory IGNs must be 2-12 alphanumeric characters.",
            color: 0xFF5722
          }]
        })
      });
      return;
    }

    // 2. Fetch Real-time Data from Nexon API (this can take time)
    const [mapleData, legionLevel] = await Promise.all([
      getCharacterData(ign, false),
      getLegionLevel(ign)
    ]);

    if (!mapleData) {
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "🔍 Character Not Found",
            description: `Could not find **${ign}** in the MapleStory NA rankings. Please check the spelling!`,
            color: 0xFFC107
          }]
        })
      });
      return;
    }

    // 3. Prepare Member Data for KV Storage
    const existingData = await getMemberData(env.MEMBERS_KV, userId);
    const isUpdate = !!existingData;

    const memberData = {
      discordId: userId,
      username: username,
      ign: mapleData.name,
      level: mapleData.level,
      job: mapleData.job,
      imageUrl: mapleData.imageUrl,
      legionLevel: legionLevel ?? existingData?.legionLevel ?? null,
      registeredAt: existingData?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 4. Save to Cloudflare KV
    await setMemberData(env.MEMBERS_KV, userId, memberData);

    // 5. Build Success Embed and send follow-up
    const embed = {
      title: `🎉 ${isUpdate ? 'Profile Updated!' : 'Welcome to Oreo!'}`,
      description: isUpdate 
        ? `Your data for **${mapleData.name}** has been synced.`
        : `You are now registered in the guild directory!`,
      color: 0x4CAF50,
      thumbnail: { url: mapleData.imageUrl },
      fields: [
        { name: "🎯 Level", value: String(mapleData.level), inline: true },
        { name: "⚔️ Job", value: mapleData.job, inline: true },
        { name: "👤 Discord", value: `<@${userId}>`, inline: true },
        ...(memberData.legionLevel != null
          ? [{ name: "⚜️ Legion", value: String(memberData.legionLevel), inline: true }]
          : [])
      ],
      footer: { text: "View the full roster on our website!" },
      timestamp: new Date().toISOString()
    };

    if (env.BOT_CHANNEL_WEBHOOK) {
      // Post the full embed to the designated bot channel
      await fetch(env.BOT_CHANNEL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      // Send an ephemeral confirmation back to the user
      await fetch(followUpUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: isUpdate ? "✅ Profile Updated!" : "✅ Welcome to Oreo!",
            description: `Your profile for **${mapleData.name}** has been posted to the bot channel.`,
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
    console.error('Registration error:', error);
    
    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "💥 System Error",
          description: "Something went wrong during registration. Please try again later.",
          color: 0xFF5722
        }]
      })
    });
  }
}