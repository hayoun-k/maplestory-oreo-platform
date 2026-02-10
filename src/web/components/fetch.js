import { getCharacterData } from '../../lib/maple-api.js';

const form = document.getElementById("form");
const characterInfoDiv = document.getElementById('output');

form.addEventListener('submit', async function(event) {
  event.preventDefault();
  
  const cName = document.getElementById("cname").value.trim();
  
  // Clear previous output and show loading state
  characterInfoDiv.innerHTML = '<p>Searching for character...</p>';

  if (!cName) {
    characterInfoDiv.innerHTML = '<p style="color: red;">Please enter a character name.</p>';
    return;
  }

  try {
    // Utilize the shared utility from src/lib/maple-api.js
    const character = await getCharacterData(cName);

    if (character) {
      // Standardized output using the object returned by the shared API
      characterInfoDiv.innerHTML = `
        <h1>Character: ${character.name}</h1>
        <img src="${character.imageUrl}" alt="${character.name} image">
        <p>Level: ${character.level}</p>
        <p>Job: ${character.job}</p>
        <p>World: ${character.world}</p>
        <p><small>Last synced: ${new Date(character.lastUpdated).toLocaleString()}</small></p>
      `;
    } else {
      characterInfoDiv.innerHTML = `<p>Character "${cName}" not found in rankings.</p>`;
    }
  } catch (error) {
    console.error('Error in fetch component:', error);
    characterInfoDiv.innerHTML = '<p>Error fetching character data. Please try again later.</p>';
  }
});