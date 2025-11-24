import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import MapView from 'react-native-maps'
import * as Location from 'expo-location'
import { runningPageStyles as styles } from './styles'
import { getAlbumCoverArt, startPlayback, pausePlayback, skipToNext } from './services/spotifyApi'

// Helper function for time formatting
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Hook for workout data collection
 * Uses GPS-based distance calculation (works in Expo Go)
 * - Distance from GPS → calculates pace
 * Note: BPM comes from the song's BPM
 */
const useWorkoutData = (isPaused, location = null, isLocationReady = false) => {
  const [workoutData, setWorkoutData] = useState({
    pace: '0:00',
    distance: '0.00',
    time: '00:00:00',
  })

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0) // in meters
  const workoutStartTimeRef = useRef(null)
  const previousLocationRef = useRef(null) // For GPS distance calculation
  const locationHistoryRef = useRef([]) // Track recent locations for current pace calculation
  const lastPaceUpdateRef = useRef(0) // Track when we last updated pace

  // Initialize workout when location is ready (not on mount)
  useEffect(() => {
    if (isLocationReady && !workoutStartTimeRef.current) {
      workoutStartTimeRef.current = new Date().toISOString()
      previousLocationRef.current = null
      locationHistoryRef.current = []
      lastPaceUpdateRef.current = 0
      setTotalDistance(0)
      setElapsedSeconds(0)
    }
  }, [isLocationReady])

  // Timer: Update elapsed time every second (only start when location is ready)
  useEffect(() => {
    if (!isLocationReady || isPaused) {
      return
    }

    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [isPaused, isLocationReady])

  // Calculate distance from GPS coordinates
  useEffect(() => {
    if (!location || isPaused) {
      return
    }

    // Initialize previous location on first update
    if (!previousLocationRef.current) {
      previousLocationRef.current = location
      return
    }

    // Calculate distance using Haversine formula
    const R = 6371000 // Earth's radius in meters
    const lat1 = previousLocationRef.current.latitude * Math.PI / 180
    const lat2 = location.latitude * Math.PI / 180
    const dLat = (location.latitude - previousLocationRef.current.latitude) * Math.PI / 180
    const dLon = (location.longitude - previousLocationRef.current.longitude) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    // Filter out GPS noise: only add distance if movement is significant (at least 3 meters)
    // This prevents accumulating tiny movements from GPS signal noise when stationary
    // Also filter out GPS jumps (more than 200m per update)
    if (distance >= 3 && distance < 200) {
      setTotalDistance(prev => prev + distance)
    }
    
    // Add to location history for current pace calculation
    locationHistoryRef.current.push({
      location: { ...location },
      timestamp: Date.now()
    })
    
    // Keep only last 60 seconds of location history (to limit memory usage)
    const oneMinuteAgo = Date.now() - 60000
    locationHistoryRef.current = locationHistoryRef.current.filter(
      entry => entry.timestamp >= oneMinuteAgo
    )
    
    // Always update previous location, even if we don't add the distance
    // This prevents accumulating noise over multiple updates
    previousLocationRef.current = location
  }, [location, isPaused])

  // Update pace every 5 seconds using raw pace calculation
  useEffect(() => {
    if (!isLocationReady || isPaused) {
      return
    }

    // Calculate pace directly from location history
    const updatePace = () => {
      const {
        calculateCurrentPace,
        metersToMiles,
      } = require('./services/healthService')

      // Calculate current pace from recent location history (20 second window for current pace)
      const currentPace = calculateCurrentPace(locationHistoryRef.current, 20)
      const distanceMiles = metersToMiles(totalDistance)

      // Update workout data with raw pace calculation
      setWorkoutData(prev => ({
        ...prev,
        pace: currentPace,
        distance: distanceMiles.toFixed(2),
        time: formatTime(elapsedSeconds),
      }))
      
      lastPaceUpdateRef.current = Date.now()
    }

    // Update immediately on start
    updatePace()

    // Then update every 5 seconds
    const paceUpdateInterval = setInterval(updatePace, 5000)

    return () => clearInterval(paceUpdateInterval)
  }, [isPaused, elapsedSeconds, totalDistance, isLocationReady])

  // Update time every second for smooth display (distance and pace update with pace interval)
  useEffect(() => {
    setWorkoutData(prev => ({
      ...prev,
      time: formatTime(elapsedSeconds),
    }))
  }, [elapsedSeconds])

  return workoutData
}

/**
 * Hook to get user's current location and track location updates
 */
const useLocation = (isWorkoutPaused) => {
  const [location, setLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const locationSubscriptionRef = useRef(null)

  // Get initial location and set up permissions
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync()
        
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied')
          setIsLoading(false)
          // Set default location if permission denied
          setLocation({
            latitude: 39.9526,
            longitude: -75.1652,
          })
          return
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        })
        setIsLoading(false)
      } catch (error) {
        setErrorMsg('Error getting location')
        setIsLoading(false)
        // Set default location on error
        setLocation({
          latitude: 39.9526,
          longitude: -75.1652,
        })
      }
    }

    getInitialLocation()
  }, [])

  // Handle location subscription - always track location
  useEffect(() => {
    if (isLoading) return

    const startLocationTracking = async () => {
      try {
        // Clean up existing subscription first
        if (locationSubscriptionRef.current) {
          locationSubscriptionRef.current.remove()
          locationSubscriptionRef.current = null
        }

        // Always track location (needed for GPS distance calculation)
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000, // Update every second
            distanceInterval: 1, // Update every meter
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            })
          }
        )
        locationSubscriptionRef.current = subscription
      } catch (error) {
        // Location tracking failed
      }
    }

    // Start tracking once we have initial location
    if (location) {
      startLocationTracking()
    }

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
        locationSubscriptionRef.current = null
      }
    }
  }, [isLoading, location])

  return { location, errorMsg, isLoading }
}


function RunningPage({ playlistTitle, currentSong, currentSongIndex = 0, allSongs = [], onStop, onPause, onSkip }) {
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false)
  const [isSongPaused, setIsSongPaused] = useState(false)
  const [albumImageUrl, setAlbumImageUrl] = useState(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const { location, errorMsg, isLoading } = useLocation(isWorkoutPaused)
  
  // Location is ready when we have a location and map has loaded
  const isLocationReady = !isLoading && location !== null && isMapReady
  
  const workoutData = useWorkoutData(isWorkoutPaused, location, isLocationReady)

  // Fetch album cover art when current song changes
  useEffect(() => {
    const fetchAlbumArt = async () => {
      if (currentSong?.albumImageUrl) {
        setAlbumImageUrl(currentSong.albumImageUrl)
      } else if (currentSong?.albumId) {
        try {
          const imageUrl = await getAlbumCoverArt(currentSong.albumId)
          setAlbumImageUrl(imageUrl)
        } catch (error) {
          setAlbumImageUrl(null)
        }
      } else {
        setAlbumImageUrl(null)
      }
    }
    
    fetchAlbumArt()
  }, [currentSong?.albumId, currentSong?.albumImageUrl])

  // Don't queue playlist here - it's already queued in Playlist.jsx handlePlay
  // This component just displays the current song and handles skip/pause

  const handleSongPause = async () => {
    const newPausedState = !isSongPaused
    setIsSongPaused(newPausedState)
    
    try {
      if (newPausedState) {
        await pausePlayback()
      } else {
        // Resume playback - Spotify will continue from where it paused in the queue
        await startPlayback({})
      }
    } catch (error) {
      setIsSongPaused(!newPausedState)
    }
  }

  const handleWorkoutPause = () => {
    setIsWorkoutPaused(!isWorkoutPaused)
    if (onPause) onPause(!isWorkoutPaused)
  }

  const handleStop = async () => {
    try {
      // Stop/pause playback when run is stopped
      await pausePlayback()
    } catch (error) {
      // Continue even if pause fails (e.g., no active device)
      console.error('Error pausing playback on stop:', error)
    }
    // Navigate to visualization
    if (onStop) onStop()
  }

  const handleSkip = async () => {
    try {
      // Calculate the next index based on the current index from parent
      const nextIndex = (currentSongIndex + 1) % allSongs.length
      const nextSong = allSongs[nextIndex]
      
      // Update the index in the parent component (this updates the UI)
      if (onSkip) onSkip()
      
      // Play the next song from our generated playlist
      if (nextSong?.spotifyUri) {
        const allUris = allSongs
          .map(song => song.spotifyUri)
          .filter(Boolean)
        
        // Play from our playlist starting at the next song
        await startPlayback({
          uris: allUris,
          offset: { position: nextIndex },
          positionMs: 0,
        })
      }
    } catch (error) {
      // Continue even if playback fails
    }
  }

  const albumArtColor = '#EFEFEF'
  const albumArtTextColor = '#000000'

  // Show loading screen until location is available
  if (isLoading || !location) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5809C0" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#5809C0' }}>
          {isLoading ? 'Getting your location...' : 'Waiting for location...'}
        </Text>
        {errorMsg && (
          <Text style={{ marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20 }}>
            {errorMsg}
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Top Section: Playlist Title, Current Song, Metrics, Controls */}
      <View style={styles.topSection}>
        <Text style={styles.playlistTitle}>{playlistTitle}</Text>
        
        <View style={styles.currentSongSection}>
          <View style={[styles.albumArtSmall, { backgroundColor: albumArtColor, overflow: 'hidden' }]}>
            {albumImageUrl ? (
              <Image 
                source={{ uri: albumImageUrl }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.albumArtTextSmall, { color: albumArtTextColor }]}>
                {currentSong?.title?.charAt(0)?.toUpperCase() || '♪'}
              </Text>
            )}
          </View>
          <View style={styles.songInfo}>
            <View style={styles.songTitleRow}>
              <View style={styles.songTitleContainer}>
                <Text style={styles.songTitle}>{currentSong?.title || 'No song playing'}</Text>
                <Text style={styles.songArtist}>{currentSong?.artist || ''}</Text>
              </View>
              <View style={styles.songControls}>
                <Pressable style={styles.controlButton} onPress={handleSongPause}>
                  <MaterialIcons 
                    name={isSongPaused ? "play-arrow" : "pause"} 
                    size={24} 
                    color="#5809C0" 
                  />
                </Pressable>
                <Pressable style={styles.controlButton} onPress={handleSkip}>
                  <MaterialIcons name="skip-next" size={24} color="#5809C0" />
                </Pressable>
              </View>
            </View>
            <Text style={styles.songBpm}>BPM: {currentSong?.bpm || 0}</Text>
          </View>
        </View>
      </View>

      {/* Middle Section: Map View */}
      <View style={styles.mapSection}>
        {!isMapReady && (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
            <ActivityIndicator size="large" color="#5809C0" />
            <Text style={{ marginTop: 16, fontSize: 14, color: '#5809C0' }}>Loading map...</Text>
          </View>
        )}
        <MapView
          style={[styles.map, !isMapReady && { position: 'absolute', opacity: 0 }]}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={!isWorkoutPaused}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onMapReady={() => {
            // Map has finished loading, now we can start the timer
            setIsMapReady(true)
          }}
        />
      </View>

      {/* Bottom Section: Performance Metrics & Controls */}
          <View style={styles.bottomSection}>
            <View style={styles.performanceMetrics}>
              <Text style={styles.performanceMetric}>Pace: {workoutData.pace} min/mi</Text>
              <Text style={styles.performanceMetric}>Dist: {workoutData.distance} mi</Text>
              <Text style={styles.performanceMetric}>Time: {workoutData.time}</Text>
            </View>
        <View style={styles.bottomControls}>
          <Pressable style={styles.bottomControlButton} onPress={handleWorkoutPause}>
            <MaterialIcons 
              name={isWorkoutPaused ? "play-arrow" : "pause"} 
              size={32} 
              color="#5809C0" 
            />
          </Pressable>
          <Pressable style={styles.bottomControlButton} onPress={handleStop}>
            <MaterialIcons name="stop" size={32} color="#5809C0" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default RunningPage

