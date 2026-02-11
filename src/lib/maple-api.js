/**
 * Shared utility to fetch character data from Nexon's MapleStory NA Ranking API.
 */
// 👇 FIXED: Added 'useInternalProxy = false' to the arguments
export async function getCharacterData(characterName, useInternalProxy = false) {
  if (!characterName) return null;

  // If running on client (web), use our own worker proxy. 
  // If running on bot, fetch directly from Nexon to avoid CORS/latency issues.
  const API_URL = useInternalProxy 
    ? `/api/character?name=${characterName}`
    : `https://www.nexon.com/api/maplestory/no-auth/v1/ranking/na?type=overall&id=weekly&reboot_index=0&page_index=1&character_name=${characterName}`;

  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Nexon API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.ranks || data.ranks.length === 0) {
      console.log(`Character "${characterName}" not found in rankings.`);
      return null;
    }

    const character = data.ranks[0];

    return {
      name: character.characterName,
      level: character.level,
      job: character.jobName,
      world: character.worldName,
      imageUrl: character.characterImgURL,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("Error fetching MapleStory character data:", error);
    return null;
  }
}