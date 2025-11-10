/**
 * GetSong BPM API Service
 * Fetches BPM data from https://api.getsong.co/
 * 
 * API Documentation: https://getsongbpm.com/api
 * 
 * Note: Requires API key registration at https://getsongbpm.com/api
 * API key should be stored in environment variable GETSONG_API_KEY
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
    console.warn('⚠️  GETSONG_API_KEY not found in environment variables.');
    console.warn('Please add GETSONG_API_KEY to your .env file.');
    console.warn('Register at https://getsongbpm.com/api to get an API key.');
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
    throw new Error('GetSong API key not configured. Please add GETSONG_API_KEY to your .env file.');
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
        'X-API-KEY': apiKey, // Alternative: use header instead of query param
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GetSong API request failed:', response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your GETSONG_API_KEY.');
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
    
    if (!data || !data.search || data.search.length === 0) {
      return null;
    }
    
    // Find the best match (exact or close match)
    // The API returns songs, so we look for the one that matches our search
    const songs = data.search.filter(item => item.title && item.artist);
    
    if (songs.length === 0) {
      return null;
    }
    
    // Try to find exact match first
    const exactMatch = songs.find(song => 
      song.title.toLowerCase() === songTitle.toLowerCase() &&
      song.artist.some(artist => artist.name.toLowerCase() === artistName.toLowerCase())
    );
    
    if (exactMatch) {
      return {
        id: exactMatch.id,
        title: exactMatch.title,
        tempo: exactMatch.tempo ? parseInt(exactMatch.tempo) : null,
        artist: exactMatch.artist,
        uri: exactMatch.uri,
      };
    }
    
    // Return first result if no exact match
    const firstResult = songs[0];
    return {
      id: firstResult.id,
      title: firstResult.title,
      tempo: firstResult.tempo ? parseInt(firstResult.tempo) : null,
      artist: firstResult.artist,
      uri: firstResult.uri,
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
      // 3000 requests/hour = ~50 requests/minute = ~1.2 seconds between requests
      // We'll use 1 second delay to be safe
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
  console.log(`✅ Retrieved BPM data for ${foundBpms}/${results.length} songs from GetSong API`);
  
  if (foundBpms === 0) {
    console.warn('⚠️  No BPM data found. Make sure GETSONG_API_KEY is set correctly.');
  }
  
  return results;
};

export default {
  searchSong,
  getSongBpm,
  batchFetchBpms,
};

