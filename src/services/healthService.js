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
 * Calculate current/instantaneous pace from recent location updates
 * Uses a sliding window of recent location data to calculate current pace
 * Answers: "At my current pace, how long would it take me to run one mile?"
 * @param {Array<{location: {latitude: number, longitude: number}, timestamp: number}>} locationHistory - Array of recent locations with timestamps
 * @param {number} windowSeconds - Time window in seconds to use for pace calculation (default: 20 seconds for current pace)
 * @returns {string} Current pace in min/mi format (e.g., "11:30" means 11 minutes 30 seconds per mile)
 */
export const calculateCurrentPace = (locationHistory, windowSeconds = 20) => {
  if (!locationHistory || locationHistory.length < 2) {
    return '0:00'
  }

  const now = Date.now()
  const windowStart = now - (windowSeconds * 1000)
  
  // Filter to locations within the time window (most recent data only)
  const recentLocations = locationHistory.filter(entry => entry.timestamp >= windowStart)
  
  // If we don't have enough data in the window, try using all available data with very relaxed thresholds
  if (recentLocations.length < 2) {
    if (locationHistory.length < 2) {
      return '0:00'
    }
    
    // Use all available data for initial reading (faster pace display when starting)
    // But only use the most recent points to avoid old slow data
    const recentPoints = locationHistory.slice(-Math.min(10, locationHistory.length))
    if (recentPoints.length < 2) {
      return '0:00'
    }
    
    const oldest = recentPoints[0]
    const newest = recentPoints[recentPoints.length - 1]
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000 // seconds
    
    // Very low threshold for initial reading (3 seconds)
    if (timeDiff < 3) {
      return '0:00'
    }
    
    // Calculate total distance using recent points only
    let totalDistance = 0
    for (let i = 1; i < recentPoints.length; i++) {
      const prev = recentPoints[i - 1]
      const curr = recentPoints[i]
      const distance = calculateDistance(
        prev.location.latitude,
        prev.location.longitude,
        curr.location.latitude,
        curr.location.longitude
      )
      
      // Filter out GPS noise and jumps
      if (distance >= 3 && distance < 200) {
        totalDistance += distance
      }
    }
    
    // Very low threshold for initial reading (5 meters)
    if (totalDistance < 5) {
      return '0:00'
    }
    
    return calculatePace(totalDistance, timeDiff)
  }
  
  // Calculate total distance and time in the window (using only recent data)
  let totalDistance = 0
  const startTime = recentLocations[0].timestamp
  const endTime = recentLocations[recentLocations.length - 1].timestamp
  const timeDiff = (endTime - startTime) / 1000 // seconds
  
  // Lower threshold for faster initial reading (5 seconds minimum)
  if (timeDiff < 5) {
    return '0:00'
  }
  
  // Sum up distances between consecutive points with filtering
  for (let i = 1; i < recentLocations.length; i++) {
    const prev = recentLocations[i - 1]
    const curr = recentLocations[i]
    const distance = calculateDistance(
      prev.location.latitude,
      prev.location.longitude,
      curr.location.latitude,
      curr.location.longitude
    )
    
    // Filter out GPS noise and jumps
    if (distance >= 3 && distance < 200) {
      totalDistance += distance
    }
  }
  
  // Lower threshold (10 meters) for faster pace display
  if (totalDistance < 10) {
    return '0:00'
  }
  
  // Calculate pace: how long would it take to run one mile at this speed?
  return calculatePace(totalDistance, timeDiff)
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}


/**
 * Convert meters to miles
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in miles (rounded to 2 decimals)
 */
export const metersToMiles = (meters) => {
  return parseFloat((meters / 1609.34).toFixed(2))
}


