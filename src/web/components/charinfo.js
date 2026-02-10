export async function getCharacterData(name) {
  try {
    const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.nexon.com/api/maplestory/no-auth/v1/ranking/na?type=overall&id=weekly&reboot_index=0&page_index=1&character_name=${name}`)
    const data = await response.json();
    console.log(data.ranks[0].characterName);
    return data.ranks[0].characterName;
    
  } catch (error) {
    console.error("Error fetching data", error);
    return null;
  }
}