/**
 * Database Service
 * Queries the local JSON file for track BPM data
 */

import tracksData from '../../assets/databases/spotify_tracks.json';

let tracksCache = null;

/**
 * Load and cache the tracks data from JSON
 * @returns {Array} - Array of track objects with track_title, artist, bpm
 */
const loadTracksData = () => {
  if (tracksCache) {
    return tracksCache;
  }
  
  try {
    tracksCache = tracksData;
    console.log(`Loaded ${tracksCache.length} tracks from JSON database`);
    return tracksCache;
  } catch (error) {
    console.error('Error loading tracks data from JSON:', error);
    return [];
  }
};

/**
 * Normalize string for comparison (lowercase, trim)
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().trim();
};

/**
 * Query BPM from JSON data by track title and artist
 * @param {string} title - Track title
 * @param {string} artist - Artist name
 * @returns {number|null} - BPM value or null if not found
 */
export const getBpmFromDatabase = async (title, artist) => {
  try {
    const tracks = loadTracksData();
    
    if (!tracks || tracks.length === 0) {
      return null;
    }

    const normalizedTitle = normalizeString(title);
    const normalizedArtist = normalizeString(artist);

    // Try exact match first
    const exactMatch = tracks.find(track => 
      normalizeString(track.track_title) === normalizedTitle &&
      normalizeString(track.artist) === normalizedArtist &&
      track.bpm !== null && track.bpm !== undefined
    );

    if (exactMatch) {
      return parseFloat(exactMatch.bpm);
    }

    // Try partial match on title and artist (in case of slight variations)
    const partialMatch = tracks.find(track => {
      const trackTitle = normalizeString(track.track_title);
      const trackArtist = normalizeString(track.artist);
      return (
        (trackTitle.includes(normalizedTitle) || normalizedTitle.includes(trackTitle)) &&
        (trackArtist.includes(normalizedArtist) || normalizedArtist.includes(trackArtist)) &&
        track.bpm !== null && track.bpm !== undefined
      );
    });

    if (partialMatch) {
      return parseFloat(partialMatch.bpm);
    }

    return null;
  } catch (error) {
    console.warn(`Error querying database for "${title}" by "${artist}":`, error.message);
    return null;
  }
};

/**
 * Batch query BPMs from JSON data for multiple songs
 * @param {Array<{title: string, artist: string}>} songs - Array of song objects
 * @returns {Promise<Array<{title: string, artist: string, bpm: number|null}>>} - Array with BPM data
 */
export const batchGetBpmsFromDatabase = async (songs) => {
  if (!songs || songs.length === 0) {
    return [];
  }

  try {
    const tracks = loadTracksData();
    
    if (!tracks || tracks.length === 0) {
      // JSON data not available, return songs without BPM
      return songs.map(song => ({ ...song, bpm: null }));
    }

    const results = [];

    // Query each song
    for (const song of songs) {
      const bpm = await getBpmFromDatabase(song.title, song.artist);
      results.push({
        ...song,
        bpm: bpm,
      });
    }

    const foundBpms = results.filter(r => r.bpm !== null).length;
    console.log(`Found BPM data in database for ${foundBpms}/${results.length} songs`);

    return results;
  } catch (error) {
    console.warn('Error in batch database query:', error.message);
    // Return songs without BPM on error
    return songs.map(song => ({ ...song, bpm: null }));
  }
};

/**
 * Close database connection (no-op for JSON, kept for compatibility)
 */
export const closeDatabase = async () => {
  // No-op for JSON data
  tracksCache = null;
};

/**
 * Initialize database (no-op for JSON, kept for compatibility)
 */
export const initDatabase = async () => {
  // Load and cache the data
  loadTracksData();
  return true;
};

export default {
  getBpmFromDatabase,
  batchGetBpmsFromDatabase,
  closeDatabase,
  initDatabase,
};
