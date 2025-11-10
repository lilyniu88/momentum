import { getValidAccessToken } from './spotifyAuth';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Make authenticated request to Spotify API
 */
const makeRequest = async (endpoint, options = {}) => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('No valid access token available');
  }
  
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    // Token might be expired, try refreshing once
    const refreshedToken = await getValidAccessToken();
    if (!refreshedToken) {
      throw new Error('Authentication failed - please log in again');
    }
    
    // Retry the request with refreshed token
    const retryResponse = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${refreshedToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!retryResponse.ok) {
      throw new Error(`API request failed: ${retryResponse.statusText}`);
    }
    
    return retryResponse.json();
  }
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
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
 * Get audio features for tracks
 */
const getAudioFeatures = async (trackIds) => {
  if (!trackIds || trackIds.length === 0) {
    return [];
  }
  
  // Spotify API allows max 100 IDs per request
  const chunks = [];
  for (let i = 0; i < trackIds.length; i += 100) {
    chunks.push(trackIds.slice(i, i + 100));
  }
  
  const allFeatures = [];
  for (const chunk of chunks) {
    const ids = chunk.join(',');
    const data = await makeRequest(`/audio-features?ids=${ids}`);
    allFeatures.push(...(data.audio_features || []));
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
    // Get top tracks
    const tracks = await getTopTracks(options);
    
    if (!tracks || tracks.length === 0) {
      return [];
    }
    
    // Extract track IDs
    const trackIds = tracks.map(track => track.id);
    
    // Get audio features
    const audioFeatures = await getAudioFeatures(trackIds);
    
    // Create a map of track ID to audio features
    const featuresMap = {};
    audioFeatures.forEach((features, index) => {
      if (features && features.id) {
        featuresMap[features.id] = features;
      }
    });
    
    // Map tracks to app format
    const mappedTracks = tracks.map((track, index) => {
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
        title: track.name,
        artist,
        bpm: bpm || 120, // Default to 120 if no BPM available
        time: formatDuration(track.duration_ms),
        expectedPace: bpm ? calculateExpectedPace(bpm) : '',
        albumArt,
        spotifyUri: track.uri,
        spotifyUrl: track.external_urls?.spotify || '',
      };
    });
    
    // Sort by BPM (descending)
    mappedTracks.sort((a, b) => b.bpm - a.bpm);
    
    return mappedTracks;
  } catch (error) {
    console.error('Error fetching top tracks with features:', error);
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

