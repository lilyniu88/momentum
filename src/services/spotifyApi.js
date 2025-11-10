import { getValidAccessToken } from './spotifyAuth';

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
 * Get audio features for a single track
 * Try individual track requests - sometimes batch endpoint is blocked but individual works
 */
const getSingleTrackAudioFeatures = async (trackId) => {
  try {
    const data = await makeRequest(`/audio-features/${trackId}`);
    return data;
  } catch (error) {
    if (error.message.includes('403')) {
      return null; // Endpoint not available
    }
    throw error;
  }
};

/**
 * Get audio features for tracks
 * NOTE: Spotify deprecated the audio-features endpoint for new apps (created after Nov 27, 2024)
 * This function tries batch requests first, then falls back to individual requests
 */
const getAudioFeatures = async (trackIds) => {
  if (!trackIds || trackIds.length === 0) {
    return [];
  }
  
  // First, try batch request (faster if it works)
  try {
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    
    const allFeatures = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const ids = chunk.join(',');
      console.log(`Trying batch audio features for ${chunk.length} tracks (chunk ${i + 1}/${chunks.length})`);
      
      const params = new URLSearchParams({ ids: ids });
      const data = await makeRequest(`/audio-features?${params.toString()}`);
      
      if (data && data.audio_features) {
        const validFeatures = data.audio_features.filter(f => f !== null);
        allFeatures.push(...validFeatures);
        console.log(`✅ Batch request succeeded! Retrieved ${validFeatures.length} audio features`);
      }
    }
    
    if (allFeatures.length > 0) {
      return allFeatures;
    }
  } catch (error) {
    if (error.message.includes('403')) {
      console.warn('Batch audio-features endpoint blocked (403). Trying individual track requests...');
    } else {
      console.warn('Batch request failed, trying individual requests:', error.message);
    }
  }
  
  // If batch failed, try individual track requests (slower but might work)
  console.log('Attempting individual track audio-features requests...');
  const allFeatures = [];
  const maxIndividualRequests = 20; // Limit to avoid too many API calls
  
  for (let i = 0; i < Math.min(trackIds.length, maxIndividualRequests); i++) {
    const trackId = trackIds[i];
    try {
      const features = await getSingleTrackAudioFeatures(trackId);
      if (features && features.tempo) {
        allFeatures.push(features);
      }
      
      // Add small delay to avoid rate limiting
      if (i < Math.min(trackIds.length, maxIndividualRequests) - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    } catch (error) {
      // Skip this track and continue
      console.warn(`Failed to get features for track ${i + 1}:`, error.message);
    }
  }
  
  if (allFeatures.length === 0) {
    console.warn('⚠️  Audio features endpoint not available (403). This is expected for new Spotify apps.');
    console.warn('Spotify deprecated audio-features for apps created after Nov 27, 2024.');
    console.warn('Tracks will use default BPM of 120.');
  } else {
    console.log(`✅ Retrieved ${allFeatures.length} audio features using individual requests`);
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
    
    // Extract track IDs
    const trackIds = tracks.map(track => track.id).filter(Boolean);
    console.log(`Fetching audio features for ${trackIds.length} tracks`);
    
    if (trackIds.length === 0) {
      console.warn('No valid track IDs found');
      return [];
    }
    
    // Get audio features (optional - continue even if it fails)
    let audioFeatures = [];
    try {
      audioFeatures = await getAudioFeatures(trackIds);
      console.log(`Retrieved audio features for ${audioFeatures?.length || 0} tracks`);
    } catch (error) {
      console.warn('Failed to fetch audio features, continuing without BPM data:', error.message);
      console.warn('Tracks will be displayed with default BPM of 120');
      // Continue without audio features - tracks will have default BPM
    }
    
    // Create a map of track ID to audio features
    const featuresMap = {};
    if (audioFeatures && Array.isArray(audioFeatures)) {
      audioFeatures.forEach((features) => {
        if (features && features.id) {
          featuresMap[features.id] = features;
        }
      });
    }
    
    // Map tracks to app format
    const mappedTracks = tracks
      .filter(track => track && track.id) // Filter out invalid tracks
      .map((track) => {
        const features = featuresMap[track.id];
        const bpm = features?.tempo ? Math.round(features.tempo) : null;
        
        // Get artist name (first artist)
        const artist = track.artists && track.artists.length > 0
          ? track.artists[0].name
          : 'Unknown Artist';
        
        // Get album art
        const albumArt = getAlbumArt(track.album);
        
        return {
          id: track.id,
          title: track.name || 'Unknown Title',
          artist,
          bpm: bpm || 120, // Default to 120 if no BPM available
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
    
    console.log(`✅ Successfully mapped ${mappedTracks.length} tracks`);
    if (audioFeatures.length === 0) {
      console.log('ℹ️  All tracks using default BPM of 120 (audio-features endpoint unavailable)');
    } else {
      console.log(`ℹ️  ${audioFeatures.length} tracks have real BPM data, ${mappedTracks.length - audioFeatures.length} using default BPM`);
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

