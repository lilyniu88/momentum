import { getValidAccessToken } from './spotifyAuth';
import { batchFetchBpms } from './getsongBpmApi';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Make authenticated request to Spotify API
 */
const makeRequest = async (endpoint, options = {}) => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('No valid access token available. Please log in again.');
  }
  
  console.log(`Making Spotify API request to: ${endpoint}`);
  
  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;
  console.log(`Full URL: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    // Token might be expired, try refreshing once
    console.log('Received 401, attempting to refresh token...');
    const refreshedToken = await getValidAccessToken();
    if (!refreshedToken) {
      throw new Error('Authentication failed - please log in again');
    }
    
    // Retry the request with refreshed token
    console.log('Retrying request with refreshed token...');
    const retryUrl = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;
    const retryResponse = await fetch(retryUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${refreshedToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!retryResponse.ok) {
      const errorText = await retryResponse.text();
      console.error('Retry request failed:', retryResponse.status, errorText);
      throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`);
    }
    
    return retryResponse.json();
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify API request failed:', response.status, response.statusText, errorText);
    
    // Try to parse error as JSON for better error messages
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson.error_description) {
        errorMessage = errorJson.error_description;
      }
    } catch (e) {
      // If not JSON, use the text as is
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

/**
 * Get user's top tracks
 */
const getTopTracks = async (options = {}) => {
  const {
    time_range = 'short_term', // short_term, medium_term, long_term
    limit = 50,
  } = options;
  
  const params = new URLSearchParams({
    time_range,
    limit: limit.toString(),
  });
  
  const data = await makeRequest(`/me/top/tracks?${params.toString()}`);
  return data.items || [];
};

/**
 * Get audio analysis for a single track
 * Uses /audio-analysis endpoint which provides tempo (BPM) data
 * Reference: https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis
 */
const getSingleTrackAudioAnalysis = async (trackId) => {
  try {
    const data = await makeRequest(`/audio-analysis/${trackId}`);
    // Extract tempo from track object in the response
    if (data && data.track && data.track.tempo) {
      return {
        id: trackId,
        tempo: data.track.tempo,
        tempo_confidence: data.track.tempo_confidence,
        // Include other useful data if needed
        key: data.track.key,
        mode: data.track.mode,
        time_signature: data.track.time_signature,
      };
    }
    return null;
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('404')) {
      return null; // Endpoint not available or track not found
    }
    throw error;
  }
};

/**
 * Get audio analysis (BPM/tempo) for tracks using /audio-analysis endpoint
 * This endpoint is available even for new Spotify apps (unlike /audio-features)
 * Returns tempo (BPM) data extracted from the audio-analysis response
 * Reference: https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis
 * 
 * @param {Array<string>} trackIds - Array of Spotify track IDs
 * @returns {Promise<Array>} - Array of objects with { id, tempo, tempo_confidence, ... }
 */
const getAudioFeatures = async (trackIds) => {
  if (!trackIds || trackIds.length === 0) {
    return [];
  }
  
  console.log(`Fetching audio analysis (BPM) for ${trackIds.length} tracks using /audio-analysis endpoint...`);
  
  const allFeatures = [];
  const maxRequests = 50; // Limit to avoid rate limiting
  
  // Process tracks in smaller batches with delays
  for (let i = 0; i < Math.min(trackIds.length, maxRequests); i++) {
    const trackId = trackIds[i];
    try {
      const analysis = await getSingleTrackAudioAnalysis(trackId);
      if (analysis && analysis.tempo) {
        allFeatures.push(analysis);
      }
      
      // Add delay between requests to avoid rate limiting (Spotify allows ~100 requests/second)
      if (i < Math.min(trackIds.length, maxRequests) - 1) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay = ~20 requests/second
      }
    } catch (error) {
      // Skip this track and continue
      console.warn(`Failed to get audio analysis for track ${i + 1}/${trackIds.length}:`, error.message);
    }
    
    // Log progress every 10 tracks
    if ((i + 1) % 10 === 0) {
      console.log(`Progress: ${i + 1}/${Math.min(trackIds.length, maxRequests)} tracks analyzed`);
    }
  }
  
  if (allFeatures.length === 0) {
    console.warn('⚠️  Could not retrieve audio analysis. Tracks will use default BPM of 120.');
  } else {
    console.log(`✅ Retrieved BPM data for ${allFeatures.length} tracks using /audio-analysis endpoint`);
  }
  
  return allFeatures;
};

/**
 * Format duration from milliseconds to mm:ss
 */
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculate expected pace from BPM
 * This is a simple approximation - you may want to adjust based on your needs
 */
const calculateExpectedPace = (bpm) => {
  if (!bpm || bpm < 60) return '';
  
  // Rough approximation: higher BPM = faster pace
  // This is a simplified calculation - adjust as needed
  const basePace = 10; // minutes per mile
  const paceAdjustment = (bpm - 120) / 20; // Adjust pace based on BPM
  const expectedPace = Math.max(5, Math.min(15, basePace - paceAdjustment));
  
  const minutes = Math.floor(expectedPace);
  const seconds = Math.round((expectedPace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get album art URL or generate a tag
 */
const getAlbumArt = (album) => {
  if (album?.images && album.images.length > 0) {
    return album.images[0].url;
  }
  
  // Generate a simple tag from album name
  if (album?.name) {
    const words = album.name.split(' ');
    if (words.length > 0) {
      return words[0].substring(0, 1).toLowerCase();
    }
  }
  
  return 'default';
};

/**
 * Fetch top tracks with audio features and map to app format
 */
const fetchTopTracksWithFeatures = async (options = {}) => {
  try {
    console.log('Fetching top tracks with options:', options);
    
    // Get top tracks
    const tracks = await getTopTracks(options);
    console.log(`Retrieved ${tracks?.length || 0} tracks from Spotify`);
    
    if (!tracks || tracks.length === 0) {
      console.warn('No tracks returned from Spotify API');
      return [];
    }
    
    // First, map tracks to basic format with title and artist
    const tracksWithInfo = tracks
      .filter(track => track && track.id)
      .map((track) => {
        const artist = track.artists && track.artists.length > 0
          ? track.artists[0].name
          : 'Unknown Artist';
        
        return {
          id: track.id,
          title: track.name || 'Unknown Title',
          artist,
          duration_ms: track.duration_ms || 0,
          album: track.album,
          uri: track.uri,
          external_urls: track.external_urls,
        };
      });
    
    // Prepare songs for GetSong BPM API lookup
    const songsForBpmLookup = tracksWithInfo.map(track => ({
      title: track.title,
      artist: track.artist,
    }));
    
    // Fetch BPMs from GetSong API
    let songsWithBpm = [];
    try {
      console.log(`Fetching BPMs for ${songsForBpmLookup.length} songs from GetSong API...`);
      songsWithBpm = await batchFetchBpms(songsForBpmLookup);
      console.log(`Retrieved BPM data for ${songsWithBpm.filter(s => s.bpm !== null).length}/${songsWithBpm.length} songs`);
    } catch (error) {
      console.warn('Failed to fetch BPMs from GetSong API, continuing without BPM data:', error.message);
      console.warn('Tracks will be displayed with default BPM of 120');
      // Continue without BPM data - create songs with null BPM
      songsWithBpm = songsForBpmLookup.map(song => ({ ...song, bpm: null }));
    }
    
    // Create a map of title+artist to BPM
    const bpmMap = {};
    songsWithBpm.forEach(song => {
      const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
      bpmMap[key] = song.bpm;
    });
    
    // Map tracks to app format with BPM data from GetSong API
    const mappedTracks = tracksWithInfo.map((track) => {
      const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
      const bpm = bpmMap[key] !== null && bpmMap[key] !== undefined 
        ? bpmMap[key] 
        : 120; // Default to 120 if no BPM found
      
      // Get album art
      const albumArt = getAlbumArt(track.album);
      
      return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        bpm: bpm,
        time: formatDuration(track.duration_ms || 0),
        expectedPace: bpm ? calculateExpectedPace(bpm) : '',
        albumArt,
        spotifyUri: track.uri,
        spotifyId: track.id,
        spotifyUrl: track.external_urls?.spotify || '',
      };
    });
    
    // Sort by BPM (descending)
    mappedTracks.sort((a, b) => b.bpm - a.bpm);
    
    const tracksWithRealBpm = mappedTracks.filter(t => {
      const key = `${t.title.toLowerCase()}|${t.artist.toLowerCase()}`;
      return bpmMap[key] !== null && bpmMap[key] !== undefined && bpmMap[key] !== 120;
    });
    console.log(`✅ Successfully mapped ${mappedTracks.length} tracks`);
    if (tracksWithRealBpm.length === 0) {
      console.log('ℹ️  All tracks using default BPM of 120 (GetSong API unavailable or no matches found)');
    } else {
      console.log(`ℹ️  ${tracksWithRealBpm.length} tracks have real BPM data from GetSong API, ${mappedTracks.length - tracksWithRealBpm.length} using default BPM`);
    }
    return mappedTracks;
  } catch (error) {
    console.error('Error fetching top tracks with features:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export {
  getTopTracks,
  getAudioFeatures,
  fetchTopTracksWithFeatures,
  formatDuration,
  calculateExpectedPace,
};

