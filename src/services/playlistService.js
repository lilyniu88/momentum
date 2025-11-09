/**
 * Playlist Service
 * Handles filtering and generation of playlists based on user preferences
 */

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
    low: { min: 120, max: 140 },
    medium: { min: 140, max: 160 },
    high: { min: 160, max: Infinity }
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
 * Generate a filtered playlist based on distance and intensity preferences
 * @param {Array} allSongs - Array of all available songs
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

