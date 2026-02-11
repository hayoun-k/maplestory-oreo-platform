/**
 * Shared utility to fetch character data from Nexon's MapleStory NA Ranking API.
 * This logic is consolidated from the original MScharcard fetch components.
 */

export async function getCharacterData(characterName) {
  if (!characterName) return null;

  // Note: Using the CORS proxy as defined in the original MScharcard repo
  const API_URL = useInternalProxy 
    ? `/api/character?name=${characterName}`
    : `https://www.nexon.com/api/maplestory/no-auth/v1/ranking/na?type=overall&id=weekly&reboot_index=0&page_index=1&character_name=${characterName}`;

  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Nexon API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Verify if the character exists in the returned ranks array
    if (!data.ranks || data.ranks.length === 0) {
      console.log(`Character "${characterName}" not found in rankings.`);
      return null;
    }

    const character = data.ranks[0];

    // Standardized object used by both Discord embeds and Astro components
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