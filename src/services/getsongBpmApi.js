/**
 * Fetches BPM data from https://api.getsong.co/
 */

const GETSONG_API_BASE = 'https://api.getsong.co';

/**
 * Get API key from environment variable
 * The API key should be set in .env file as GETSONG_API_KEY
 */
const getApiKey = () => {
  // In React Native/Expo, environment variables are accessed via process.env
  // Make sure to add GETSONG_API_KEY to your .env file
  const apiKey = process.env.GETSONG_API_KEY || process.env.EXPO_PUBLIC_GETSONG_API_KEY;
  
  if (!apiKey) {
    console.warn('GETSONG_API_KEY not found in environment variables.');
    return null;
  }
  
  return apiKey;
};

/**
 * Make request to GetSong BPM API
 */
const makeRequest = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('GetSong API key not configured.');
  }
  
  // Build URL with API key
  const urlParams = new URLSearchParams({
    api_key: apiKey,
    ...params,
  });
  
  const url = `${GETSONG_API_BASE}${endpoint}?${urlParams.toString()}`;
  
  console.log(`Making GetSong API request to: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey, 
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GetSong API request failed:', response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }
      
      throw new Error(`GetSong API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes('API key')) {
      throw error;
    }
    console.error('Error making GetSong API request:', error);
    throw new Error(`Failed to fetch from GetSong API: ${error.message}`);
  }
};

/**
 * Search for a song by title and artist
 * @param {string} songTitle - The song title
 * @param {string} artistName - The artist name
 * @returns {Promise<Object|null>} - Song object with BPM data, or null if not found
 */
export const searchSong = async (songTitle, artistName) => {
  try {
    if (!songTitle || !artistName) {
      return null;
    }
    
    // Format search query: "song:title artist:artistname"
    const lookup = `song:${encodeURIComponent(songTitle)} artist:${encodeURIComponent(artistName)}`;
    
    const data = await makeRequest('/search/', {
      type: 'both',
      lookup,
      limit: '5', // Get top 5 results
    });
    
    let searchResults = null;
    
    // Check for error response first
    if (data && data.search && data.search.error) {
      return null;
    }
    
    if (Array.isArray(data)) {
      // Direct array response
      searchResults = data;
    } else if (data && data.search && Array.isArray(data.search)) {
      searchResults = data.search;
    } else if (data && typeof data === 'object') {
      // Try to find any array property in the response
      for (const key in data) {
        if (Array.isArray(data[key])) {
          searchResults = data[key];
          break;
        }
      }
    }
    
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    
    // Use the first song returned from the API
    const firstSong = searchResults[0];
    
    if (!firstSong || !firstSong.title || !firstSong.tempo) {
      return null;
    }
    
    return {
      id: firstSong.id,
      title: firstSong.title,
      tempo: firstSong.tempo ? parseInt(firstSong.tempo) : null,
      artist: firstSong.artist, 
      uri: firstSong.uri,
    };
  } catch (error) {
    console.warn(`Failed to search song "${songTitle}" by "${artistName}":`, error.message);
    return null;
  }
};

/**
 * Get BPM for a song by its GetSong ID
 * @param {string} songId - The GetSong song ID
 * @returns {Promise<number|null>} - BPM value or null if not found
 */
export const getSongBpm = async (songId) => {
  try {
    if (!songId) {
      return null;
    }
    
    const data = await makeRequest('/song/', {
      id: songId,
    });
    
    if (!data || !data.song || !data.song.tempo) {
      return null;
    }
    
    return parseInt(data.song.tempo);
  } catch (error) {
    console.warn(`Failed to get BPM for song ID "${songId}":`, error.message);
    return null;
  }
};

/**
 * Batch fetch BPMs for multiple songs
 * @param {Array<{title: string, artist: string}>} songs - Array of song objects with title and artist
 * @returns {Promise<Array<{title: string, artist: string, bpm: number|null}>>} - Array of songs with BPM data
 */
export const batchFetchBpms = async (songs) => {
  if (!songs || songs.length === 0) {
    return [];
  }
  
  console.log(`Fetching BPMs for ${songs.length} songs from GetSong API...`);
  
  const results = [];
  const maxRequests = 50; // Limit to avoid rate limiting (3000 requests/hour)
  
  // Process songs with delays to avoid rate limiting
  for (let i = 0; i < Math.min(songs.length, maxRequests); i++) {
    const song = songs[i];
    
    try {
      const songData = await searchSong(song.title, song.artist);
      
      if (songData && songData.tempo) {
        // Keep the original artist string (not the array from GetSong API)
        results.push({
          ...song,
          bpm: songData.tempo,
          getsongId: songData.id,
        });
      } else {
        // If not found, keep original song without BPM
        results.push({
          ...song,
          bpm: null,
        });
      }
      
      // Add delay between requests to avoid rate limiting
      if (i < Math.min(songs.length, maxRequests) - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.warn(`Failed to fetch BPM for song ${i + 1}/${songs.length}:`, error.message);
      // Continue with next song
      results.push({
        ...song,
        bpm: null,
      });
    }
    
    // Log progress every 10 songs
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${Math.min(songs.length, maxRequests)} songs processed`);
    }
  }
  
  const foundBpms = results.filter(r => r.bpm !== null).length;
  console.log( `Retrieved BPM data for ${foundBpms}/${results.length} songs from GetSong API`);
  
  if (foundBpms === 0) {
    console.warn('No BPM data found.');
  }
  
  return results;
};

export default {
  searchSong,
  getSongBpm,
  batchFetchBpms,
};

