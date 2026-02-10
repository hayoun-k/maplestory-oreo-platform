export async function getMemberData(kv, userId) {
  try {
    console.log('Getting member data for userId:', userId);
    const data = await kv.get(`member:${userId}`);
    console.log('Raw data from KV:', data);
    const parsed = data ? JSON.parse(data) : null;
    console.log('Parsed data:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error getting member data:', error);
    return null;
  }
}

export async function setMemberData(kv, userId, data) {
  try {
    console.log('Setting member data for userId:', userId);
    console.log('Data being stored:', data);
    const key = `member:${userId}`;
    console.log('Using key:', key);
    const jsonData = JSON.stringify(data);
    console.log('JSON data:', jsonData);
    
    await kv.put(key, jsonData);
    console.log('Data stored successfully');
    
    // Immediately try to read it back to verify
    const verification = await kv.get(key);
    console.log('Verification read:', verification);
    
    return true;
  } catch (error) {
    console.error('Error setting member data:', error);
    return false;
  }
}

export async function getAllMembers(kv) {
  try {
    console.log('Getting all members...');
    const list = await kv.list({ prefix: 'member:' });
    console.log('KV list result:', list);
    console.log('Number of keys found:', list.keys.length);
    console.log('Keys:', list.keys);
    
    const members = [];
    
    for (const key of list.keys) {
      console.log('Processing key:', key.name);
      const data = await kv.get(key.name);
      console.log('Data for key', key.name, ':', data);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('Parsed data:', parsed);
        members.push(parsed);
      }
    }
    
    console.log('Final members array:', members);
    return members;
  } catch (error) {
    console.error('Error getting all members:', error);
    return [];
  }
}