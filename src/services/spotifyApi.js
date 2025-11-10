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
  
  const url = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Only include body if it's provided and method is PUT/POST
    ...(options.body && (options.method === 'PUT' || options.method === 'POST') ? { body: options.body } : {}),
  });
  
  if (response.status === 401) {
    // Check if it's a permissions/scope issue
    const errorText = await response.text();
    let errorJson = null;
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {
      // Not JSON, continue with normal refresh flow
    }
    
    // If error message indicates missing permissions/scopes, we need to re-authenticate
    // BUT: Only clear tokens if this is a critical endpoint (playback control)
    // Device fetching failures shouldn't clear tokens
    const isCriticalEndpoint = endpoint.includes('/player/play') || 
                                endpoint.includes('/player/pause') || 
                                endpoint.includes('/player/next') || 
                                endpoint.includes('/player/previous');
    
    if ((errorJson?.error?.message?.toLowerCase().includes('permissions') || 
         errorJson?.error?.message?.toLowerCase().includes('scope')) && isCriticalEndpoint) {
      const { clearTokens } = require('./spotifyAuth');
      await clearTokens();
      throw new Error('Missing permissions: Please disconnect and reconnect Spotify to grant playback permissions.');
    } else if (errorJson?.error?.message?.toLowerCase().includes('permissions') || 
               errorJson?.error?.message?.toLowerCase().includes('scope')) {
      throw new Error(`Missing permissions for ${endpoint}. This may not be critical.`);
    }
    
    const refreshedToken = await getValidAccessToken();
    if (!refreshedToken) {
      throw new Error('Authentication failed - please log in again');
    }
    const retryUrl = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_API_BASE}${endpoint}`;
    const retryResponse = await fetch(retryUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${refreshedToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...(options.body && (options.method === 'PUT' || options.method === 'POST') ? { body: options.body } : {}),
    });
    
    if (retryResponse.status === 204) {
      return null;
    }
    
    if (!retryResponse.ok) {
      const retryErrorText = await retryResponse.text();
      console.error('Retry request failed:', retryResponse.status, retryErrorText);
      
      // Check if retry also failed due to missing permissions
      let retryErrorJson = null;
      try {
        retryErrorJson = JSON.parse(retryErrorText);
      } catch (e) {}
      
      if (retryErrorJson?.error?.message?.toLowerCase().includes('permissions') || 
          retryErrorJson?.error?.message?.toLowerCase().includes('scope')) {
        const { clearTokens } = require('./spotifyAuth');
        await clearTokens();
        throw new Error('Missing permissions: Please disconnect and reconnect Spotify to grant playback permissions.');
      }
      
      throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`);
    }
    
    const retryContentType = retryResponse.headers.get('content-type');
    if (!retryContentType || !retryContentType.includes('application/json')) {
      return null;
    }
    
    return retryResponse.json();
  }
  
  // Handle 204 No Content (successful PUT/POST with no response body)
  if (response.status === 204) {
    return null;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify API request failed:', response.status, response.statusText, errorText);
    
    // Try to parse error as JSON for better error messages
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    let errorReason = null;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson.error_description) {
        errorMessage = errorJson.error_description;
      }
      if (errorJson.error?.reason) {
        errorReason = errorJson.error.reason;
      }
    } catch (e) {
      // If not JSON, use the text as is
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
    }
    
    // Create error with reason for better handling
    const error = new Error(errorMessage);
    if (errorReason) {
      error.reason = errorReason;
    }
    throw error;
  }
  
  // For empty responses, return null instead of trying to parse JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
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
 * Get album information including cover art
 * Reference: https://developer.spotify.com/documentation/web-api/reference/get-an-album
 * 
 * @param {string} albumId - The Spotify ID of the album
 * @param {string} market - Optional. An ISO 3166-1 alpha-2 country code
 * @returns {Promise<Object>} - Album object with images array containing cover art
 */
const getAlbum = async (albumId, market = null) => {
  try {
    const params = new URLSearchParams();
    if (market) {
      params.append('market', market);
    }
    
    const endpoint = `/albums/${albumId}${params.toString() ? `?${params.toString()}` : ''}`;
    const album = await makeRequest(endpoint);
    
    // Album object includes images array: [{ url, height, width }, ...]
    // Usually sorted by size (largest first)
    return album;
  } catch (error) {
    console.error(`Error fetching album ${albumId}:`, error);
    throw error;
  }
};

/**
 * Get album cover art URL
 * Helper function that fetches album and returns the cover art URL
 * 
 * @param {string} albumId - The Spotify ID of the album
 * @returns {Promise<string|null>} - URL of the album cover art, or null if not found
 */
const getAlbumCoverArt = async (albumId) => {
  try {
    const album = await getAlbum(albumId);
    // Images array is usually sorted by size, first one is typically the largest
    if (album?.images && album.images.length > 0) {
      return album.images[0].url;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching album cover art for ${albumId}:`, error);
    return null;
  }
};

/**
 * Get audio features for tracks
 * Note: Spotify's audio-features and audio-analysis endpoints are deprecated for new apps
 * This function returns an empty array - tracks will use default BPM of 120
 * 
 * @param {Array<string>} trackIds - Array of Spotify track IDs
 * @returns {Promise<Array>} - Array of objects with { id, tempo, ... }
 */
const getAudioFeatures = async (trackIds) => {
  // Audio features endpoints are deprecated for new Spotify apps
  // Return empty array - tracks will use default BPM
    return [];
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
    const tracks = await getTopTracks(options);
    
    if (!tracks || tracks.length === 0) {
      return [];
    }
    
    const trackIds = tracks.map(track => track.id).filter(Boolean);
    
    let audioFeatures = [];
    try {
      audioFeatures = await getAudioFeatures(trackIds);
    } catch (error) {
      // Continue without BPM data - tracks will have default BPM
    }
    
    // Create a map of track ID to audio features data
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
      
      // Get album art (URL from track.album.images if available)
      const albumArt = getAlbumArt(track.album);
      
      return {
        id: track.id,
          title: track.name || 'Unknown Title',
        artist,
        bpm: bpm || 120, // Default to 120 if no BPM available
          time: formatDuration(track.duration_ms || 0),
        expectedPace: bpm ? calculateExpectedPace(bpm) : '',
        albumArt,
        albumId: track.album?.id || null, // Store album ID for fetching cover art
        albumImageUrl: track.album?.images?.[0]?.url || null, // Use image from track if available
        spotifyUri: track.uri,
        spotifyId: track.id,
        spotifyUrl: track.external_urls?.spotify || '',
      };
    });
    
    mappedTracks.sort((a, b) => b.bpm - a.bpm);
    
    return mappedTracks;
  } catch (error) {
    console.error('Error fetching top tracks with features:', error);
    throw error;
  }
};

/**
 * Start or resume playback on user's active device
 * Reference: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
 * 
 * @param {Object} options - Playback options
 * @param {string} options.deviceId - Optional. Device ID to play on
 * @param {string|Array<string>} options.uris - Spotify track URIs to play (array or single URI)
 * @param {string} options.contextUri - Optional. Spotify URI of context (album, artist, playlist)
 * @param {number} options.positionMs - Optional. Position to start playback (in milliseconds)
 * @param {Object} options.offset - Optional. Offset object with position or uri
 * @returns {Promise<void>}
 */
const startPlayback = async (options = {}) => {
  const body = {};
  
  if (options.uris) {
    body.uris = Array.isArray(options.uris) ? options.uris : [options.uris];
  }
  
  if (options.contextUri) {
    body.context_uri = options.contextUri;
  }
  
  if (options.positionMs !== undefined) {
    body.position_ms = options.positionMs;
  }
  
  if (options.offset) {
    body.offset = options.offset;
  }
  
  const params = new URLSearchParams();
  if (options.deviceId) {
    params.append('device_id', options.deviceId);
  }
  
  const endpoint = `/me/player/play${params.toString() ? `?${params.toString()}` : ''}`;
  
  try {
    await makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error.message.includes('No valid access token') || error.message.includes('Authentication failed')) {
      const enhancedError = new Error('Authentication required. Please disconnect and reconnect Spotify.');
      enhancedError.code = 'AUTH_REQUIRED';
      throw enhancedError;
    }
    
    if (error.message.includes('No active device') || error.message.includes('NO_ACTIVE_DEVICE') || error.reason === 'NO_ACTIVE_DEVICE') {
      const enhancedError = new Error('No active device found. Please open Spotify on your phone, computer, or web player and try again.');
      enhancedError.code = 'NO_ACTIVE_DEVICE';
      enhancedError.reason = 'NO_ACTIVE_DEVICE';
      throw enhancedError;
    }
    
    throw error;
  }
};

/**
 * Pause playback on user's active device
 * Reference: https://developer.spotify.com/documentation/web-api/reference/pause-a-users-playback
 * 
 * @param {string} deviceId - Optional. Device ID to pause
 * @returns {Promise<void>}
 */
const pausePlayback = async (deviceId = null) => {
  try {
    const params = new URLSearchParams();
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    
    const endpoint = `/me/player/pause${params.toString() ? `?${params.toString()}` : ''}`;
    
    await makeRequest(endpoint, {
      method: 'PUT',
    });
  } catch (error) {
    console.error('Error pausing playback:', error);
    throw error;
  }
};

/**
 * Skip to next track
 * Reference: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track
 * 
 * @param {string} deviceId - Optional. Device ID
 * @returns {Promise<void>}
 */
const skipToNext = async (deviceId = null) => {
  try {
    const params = new URLSearchParams();
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    
    const endpoint = `/me/player/next${params.toString() ? `?${params.toString()}` : ''}`;
    
    await makeRequest(endpoint, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error skipping to next track:', error);
    throw error;
  }
};

/**
 * Skip to previous track
 * Reference: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-previous-track
 * 
 * @param {string} deviceId - Optional. Device ID
 * @returns {Promise<void>}
 */
const skipToPrevious = async (deviceId = null) => {
  try {
    const params = new URLSearchParams();
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    
    const endpoint = `/me/player/previous${params.toString() ? `?${params.toString()}` : ''}`;
    
    await makeRequest(endpoint, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error skipping to previous track:', error);
    throw error;
  }
};

/**
 * Transfer playback to a device
 * Reference: https://developer.spotify.com/documentation/web-api/reference/transfer-a-users-playback
 * 
 * @param {string|Array<string>} deviceIds - Device ID(s) to transfer playback to
 * @param {boolean} play - Whether to start playing on the device
 * @returns {Promise<void>}
 */
const transferPlayback = async (deviceIds, play = false) => {
  try {
    const body = {
      device_ids: Array.isArray(deviceIds) ? deviceIds : [deviceIds],
      play: play,
    };
    
    await makeRequest('/me/player', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get available devices
 * Reference: https://developer.spotify.com/documentation/web-api/reference/get-a-users-available-devices
 * 
 * @returns {Promise<Array>} - Array of device objects
 */
const getAvailableDevices = async () => {
  try {
    const data = await makeRequest('/me/player/devices');
    return data.devices || [];
  } catch (error) {
    return [];
  }
};

export {
  getTopTracks,
  getAudioFeatures,
  fetchTopTracksWithFeatures,
  formatDuration,
  calculateExpectedPace,
  getAlbum,
  getAlbumCoverArt,
  startPlayback,
  pausePlayback,
  skipToNext,
  skipToPrevious,
  getAvailableDevices,
  transferPlayback,
};

