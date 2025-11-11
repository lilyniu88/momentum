/**
 * Playlist Service
 * Handles filtering and generation of playlists based on user preferences
 * Fetches BPM data from GetSong API and filters by intensity and distance
 */

import { batchFetchBpms } from './getsongBpmApi';

// Helper function to convert time string (e.g., "2:14") to seconds
const timeToSeconds = (timeString) => {
  const [minutes, seconds] = timeString.split(':').map(Number)
  return minutes * 60 + seconds
}

// Helper function to convert seconds to minutes
const secondsToMinutes = (seconds) => {
  return Math.floor(seconds / 60)
}

/**
 * Get BPM range for intensity level
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Object} - { min, max } BPM range
 */
export const getBPMRange = (intensity) => {
  const ranges = {
    // low: { min: 120, max: 140 },
    // medium: { min: 140, max: 160 },
    // high: { min: 160, max: Infinity }
    low: { min: 0, max: 120 },      // Under 120 BPM
    medium: { min: 120, max: 120 },  // Exactly 120 BPM
    high: { min: 121, max: Infinity } // Over 120 BPM
  }
  return ranges[intensity] || { min: 0, max: Infinity }
}

/**
 * Get duration range for distance level
 * @param {string} distance - 'short', 'medium', or 'long'
 * @returns {Object} - { min, max } duration in minutes
 */
export const getDurationRange = (distance) => {
  const ranges = {
    short: { min: 0, max: 20 },
    medium: { min: 20, max: 40 },
    long: { min: 40, max: Infinity }
  }
  return ranges[distance] || { min: 0, max: Infinity }
}

/**
 * Filter songs by BPM (intensity)
 * @param {Array} songs - Array of song objects with bpm property
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Array} - Filtered array of songs
 */
export const filterByIntensity = (songs, intensity) => {
  if (!intensity) return songs
  
  const { min, max } = getBPMRange(intensity)
  return songs.filter(song => {
    const bpm = song.bpm || 0
    // For medium (exactly 120), check equality
    if (min === 120 && max === 120) {
      return bpm === 120
    }
    // For low (< 120), check bpm < 120
    // For high (> 120), check bpm > 120
    return bpm >= min && (max === Infinity || bpm < max)
  })
}

/**
 * Filter songs by total duration (distance)
 * @param {Array} songs - Array of song objects with time property (format: "M:SS")
 * @param {string} distance - 'short', 'medium', or 'long'
 * @returns {Array} - Filtered array of songs that fit within duration range
 */
export const filterByDistance = (songs, distance) => {
  if (!distance || songs.length === 0) return songs
  
  const { min, max } = getDurationRange(distance)
  const minSeconds = min * 60
  const maxSeconds = max === Infinity ? Infinity : max * 60
  
  // For short playlists (≤20 min), we want to stay under the limit
  // For medium (20-40 min) and long (40+ min), we want to fill the range
  if (distance === 'short') {
    // Short: Keep adding songs until we approach 20 minutes
    const selectedSongs = []
    let totalDuration = 0
    
    for (const song of songs) {
      const songDuration = timeToSeconds(song.time)
      if (totalDuration + songDuration <= maxSeconds) {
        selectedSongs.push(song)
        totalDuration += songDuration
      } else {
        break
      }
    }
    
    return selectedSongs.length > 0 ? selectedSongs : songs.slice(0, 1)
  } else {
    // Medium and Long: Build playlist to fill the range
    // Sort songs by duration (ascending) to optimize selection
    const sortedSongs = [...songs].sort((a, b) => {
      return timeToSeconds(a.time) - timeToSeconds(b.time)
    })
    
    const selectedSongs = []
    let totalDuration = 0
    
    // First, add songs until we reach the minimum
    for (const song of sortedSongs) {
      const songDuration = timeToSeconds(song.time)
      const newTotal = totalDuration + songDuration
      
      if (newTotal <= maxSeconds) {
        selectedSongs.push(song)
        totalDuration = newTotal
        
        // If we've reached the minimum, we can stop (or continue to max)
        if (totalDuration >= minSeconds) {
          // For medium, try to stay closer to the lower end
          // For long, we can continue adding
          if (distance === 'medium' && totalDuration >= minSeconds * 1.2) {
            break
          }
        }
      } else {
        break
      }
    }
    
    // If we haven't reached the minimum, try to add more songs
    if (totalDuration < minSeconds) {
      // Try adding from the original list (not sorted) to reach minimum
      for (const song of songs) {
        if (selectedSongs.find(s => s.id === song.id)) continue
        
        const songDuration = timeToSeconds(song.time)
        if (totalDuration + songDuration <= maxSeconds) {
          selectedSongs.push(song)
          totalDuration += songDuration
          if (totalDuration >= minSeconds) break
        }
      }
    }
    
    return selectedSongs.length > 0 ? selectedSongs : songs.slice(0, Math.min(5, songs.length))
  }
}

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
 */
const calculateExpectedPace = (bpm) => {
  if (!bpm || bpm < 60) return '';
  
  const basePace = 10; // minutes per mile
  const paceAdjustment = (bpm - 120) / 20;
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
  
  if (album?.name) {
    const words = album.name.split(' ');
    if (words.length > 0) {
      return words[0].substring(0, 1).toLowerCase();
    }
  }
  
  return 'default';
};

/**
 * Fetch BPMs for tracks and filter by intensity and distance
 * @param {Array} tracks - Array of Spotify track objects
 * @param {string} distance - 'short', 'medium', or 'long'
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Promise<Array>} - Filtered playlist with BPM data
 */
export const fetchAndFilterPlaylist = async (tracks, distance, intensity) => {
  if (!tracks || tracks.length === 0) {
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
    
    const albumArt = getAlbumArt(track.album);
    
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      bpm: bpm,
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

  // Filter by intensity (BPM)
  let filteredSongs = filterByIntensity(mappedTracks, intensity);
  
  // Filter by distance (duration)
  filteredSongs = filterByDistance(filteredSongs, distance);

  // Sort by BPM (descending)
  filteredSongs.sort((a, b) => b.bpm - a.bpm);

  return filteredSongs;
};

/**
 * Generate a filtered playlist based on distance and intensity preferences
 * @param {Array} allSongs - Array of all available songs (already with BPM data)
 * @param {string} distance - 'short', 'medium', or 'long'
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Array} - Filtered and sorted playlist
 */
export const generatePlaylist = (allSongs, distance, intensity) => {
  if (!allSongs || allSongs.length === 0) {
    return []
  }
  
  // First filter by intensity (BPM)
  let filteredSongs = filterByIntensity(allSongs, intensity)
  
  // Then filter by distance (duration)
  filteredSongs = filterByDistance(filteredSongs, distance)
  
  return filteredSongs
}

/**
 * Placeholder function for Spotify API integration
 * This would fetch songs from Spotify based on user's top genres
 * @param {Array} topGenres - Array of user's top Spotify genres
 * @param {string} distance - 'short', 'medium', or 'long'
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Promise<Array>} - Promise that resolves to array of song objects
 */
export const fetchSpotifyPlaylist = async (topGenres, distance, intensity) => {
  // TODO: Implement Spotify API integration
  // This would:
  // 1. Get user's top genres from Spotify API
  // 2. Search for tracks in those genres
  // 3. Filter by BPM (intensity)
  // 4. Filter by total duration (distance)
  // 5. Return formatted song objects
  
  console.log('Spotify API integration not yet implemented')
  console.log('Would fetch songs for genres:', topGenres)
  console.log('With filters - Distance:', distance, 'Intensity:', intensity)
  
  // Return empty array as placeholder
  return []
}

