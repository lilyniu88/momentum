/**
 * Health Service
 * Provides utility functions for workout data calculation
 * Uses GPS-based distance (works in Expo Go)
 */

/**
 * Calculate pace from distance and elapsed time
 * @param {number} distance - Distance in meters
 * @param {number} elapsedSeconds - Elapsed time in seconds
 * @returns {string} Pace in min/mi format (e.g., "6:02")
 */
export const calculatePace = (distance, elapsedSeconds) => {
  // Only return 0:00 if distance is actually 0 or time is 0
  if (distance === 0 || elapsedSeconds === 0) {
    return '0:00'
  }

  // Convert meters to miles
  const distanceMiles = distance / 1609.34
  
  // Calculate pace in seconds per mile (time / distance)
  const paceSecondsPerMile = elapsedSeconds / distanceMiles
  
  // Convert to minutes and seconds
  const minutes = Math.floor(paceSecondsPerMile / 60)
  const seconds = Math.floor(paceSecondsPerMile % 60)
  
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}


/**
 * Convert meters to miles
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in miles (rounded to 2 decimals)
 */
export const metersToMiles = (meters) => {
  return parseFloat((meters / 1609.34).toFixed(2))
}

