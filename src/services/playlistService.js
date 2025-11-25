/**
 * Playlist Service
 * Handles filtering and generation of playlists based on user preferences
 * Fetches BPM data from local database and Spotify playlists, filters by intensity and distance
 */

import { batchGetBpmsFromDatabase } from './databaseService';
import { getPlaylistOrAlbumTracks } from './spotifyApi';

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
 * Spotify playlist IDs for different BPM ranges
 */
const SPOTIFY_PLAYLISTS = {
  130: '0rk91AJ5eLcenUKbAlCmTP',  // 130 BPM Mix
  170: '5mn8yt78HIXg161cccC29T',  // 170 BPM Mix
  180: '3DpH0nPzLIKjxA35dRXzBp',  // 180 BPM Mix
};

/**
 * Get Spotify playlist ID for intensity level
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {string|null} - Spotify playlist ID or null
 */
const getPlaylistIdForIntensity = (intensity) => {
  // Map intensity to target BPM and corresponding playlist
  const mapping = {
    low: SPOTIFY_PLAYLISTS[130],      // Use 130 BPM playlist for low
    medium: SPOTIFY_PLAYLISTS[170],  // Use 170 BPM playlist for medium
    high: SPOTIFY_PLAYLISTS[180],     // Use 180 BPM playlist for high (default)
  };
  return mapping[intensity] || null;
};

/**
 * Get BPM range for intensity level
 * @param {string} intensity - 'low', 'medium', or 'high'
 * @returns {Object} - { min, max } BPM range
 */
export const getBPMRange = (intensity) => {
  const ranges = {
    low: { min: 120, max: 140 },
    medium: { min: 140, max: 180 },  // Updated to include 170 BPM
    high: { min: 180, max: Infinity }
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

  // Prepare songs for BPM lookup from database
  const songsForBpmLookup = tracksWithInfo.map(track => ({
    title: track.title,
    artist: track.artist,
  }));

  // Query database for BPM data
  let songsWithBpm = [];
  try {
    console.log(`Querying database for BPMs of ${songsForBpmLookup.length} songs...`);
    songsWithBpm = await batchGetBpmsFromDatabase(songsForBpmLookup);
    
    const foundInDb = songsWithBpm.filter(s => s.bpm !== null && s.bpm !== undefined).length;
    console.log(`Found BPM data in database for ${foundInDb}/${songsForBpmLookup.length} songs`);
  } catch (error) {
    console.warn('Error querying database:', error.message);
    songsWithBpm = songsForBpmLookup.map(song => ({ ...song, bpm: null }));
  }

  // Create a map of title+artist to BPM
  const bpmMap = {};
  songsWithBpm.forEach(song => {
    const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
    bpmMap[key] = song.bpm;
  });

  // Map tracks to app format with BPM data from database
  const mappedTracks = tracksWithInfo.map((track) => {
    const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
    const bpm = bpmMap[key] !== null && bpmMap[key] !== undefined 
      ? bpmMap[key] 
      : null; // Don't default to 120, keep as null if not found
    
    const albumArt = getAlbumArt(track.album);
    
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      bpm: bpm,
      time: formatDuration(track.duration_ms || 0),
      expectedPace: bpm ? calculateExpectedPace(bpm) : '',
      albumArt,
      albumId: track.album?.id || null,
      albumImageUrl: track.album?.images?.[0]?.url || null,
      spotifyUri: track.uri,
      spotifyId: track.id,
      spotifyUrl: track.external_urls?.spotify || '',
    };
  });

  // Filter by intensity (BPM)
  let filteredSongs = filterByIntensity(mappedTracks, intensity);
  
  // Check if we have enough songs after filtering
  // If not enough, fetch from Spotify playlist
  const { min, max } = getDurationRange(distance);
  const minDurationSeconds = min * 60;
  const maxDurationSeconds = max === Infinity ? Infinity : max * 60;
  
  let totalDuration = 0;
  filteredSongs.forEach(song => {
    totalDuration += timeToSeconds(song.time);
  });
  
  const needsMoreSongs = totalDuration < minDurationSeconds || filteredSongs.length < 3;
  
  if (needsMoreSongs) {
    const playlistId = getPlaylistIdForIntensity(intensity);
    if (playlistId) {
      try {
        console.log(`Not enough songs (${filteredSongs.length}), fetching from Spotify playlist/album ${playlistId}...`);
        const playlistTracks = await getPlaylistOrAlbumTracks(playlistId, 100);
        
        if (!playlistTracks || playlistTracks.length === 0) {
          console.warn(`No tracks found from playlist/album ${playlistId}. May be private or inaccessible.`);
        } else if (playlistTracks && playlistTracks.length > 0) {
          // Map playlist tracks to our format
          const playlistTracksWithInfo = playlistTracks
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
          
          // Get BPMs for playlist tracks from database
          const playlistSongsForBpmLookup = playlistTracksWithInfo.map(track => ({
            title: track.title,
            artist: track.artist,
          }));
          
          let playlistSongsWithBpm = [];
          try {
            playlistSongsWithBpm = await batchGetBpmsFromDatabase(playlistSongsForBpmLookup);
          } catch (error) {
            console.warn('Error querying database for playlist tracks:', error.message);
            playlistSongsWithBpm = playlistSongsForBpmLookup.map(song => ({ ...song, bpm: null }));
          }
          
          // Create BPM map for playlist tracks
          const playlistBpmMap = {};
          playlistSongsWithBpm.forEach(song => {
            const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
            playlistBpmMap[key] = song.bpm;
          });
          
          // Map playlist tracks to app format
          const mappedPlaylistTracks = playlistTracksWithInfo.map((track) => {
            const key = `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
            // For playlist tracks, use the target BPM based on playlist
            // 130 BPM playlist -> 130, 170 BPM playlist -> 170, etc.
            let targetBpm = null;
            if (playlistId === SPOTIFY_PLAYLISTS[130]) targetBpm = 130;
            else if (playlistId === SPOTIFY_PLAYLISTS[170]) targetBpm = 170;
            else if (playlistId === SPOTIFY_PLAYLISTS[180]) targetBpm = 180;
            else if (playlistId === SPOTIFY_PLAYLISTS[190]) targetBpm = 190;
            
            // Use database BPM if available, otherwise use target BPM
            const bpm = playlistBpmMap[key] !== null && playlistBpmMap[key] !== undefined
              ? playlistBpmMap[key]
              : targetBpm;
            
            const albumArt = getAlbumArt(track.album);
            
            return {
              id: track.id,
              title: track.title,
              artist: track.artist,
              bpm: bpm,
              time: formatDuration(track.duration_ms || 0),
              expectedPace: bpm ? calculateExpectedPace(bpm) : '',
              albumArt,
              albumId: track.album?.id || null,
              albumImageUrl: track.album?.images?.[0]?.url || null,
              spotifyUri: track.uri,
              spotifyId: track.id,
              spotifyUrl: track.external_urls?.spotify || '',
            };
          });
          
          // Filter playlist tracks by intensity
          const filteredPlaylistTracks = filterByIntensity(mappedPlaylistTracks, intensity);
          
          // Combine with existing tracks (avoid duplicates)
          const existingIds = new Set(filteredSongs.map(s => s.id));
          const newTracks = filteredPlaylistTracks.filter(t => !existingIds.has(t.id));
          
          filteredSongs = [...filteredSongs, ...newTracks];
          console.log(`Added ${newTracks.length} tracks from Spotify playlist`);
        }
      } catch (error) {
        console.warn('Error fetching from Spotify playlist:', error.message);
      }
    }
  }
  
  // Filter by distance (duration)
  filteredSongs = filterByDistance(filteredSongs, distance);

  // Sort by BPM (descending)
  filteredSongs.sort((a, b) => (b.bpm || 0) - (a.bpm || 0));

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

