import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import MapView from 'react-native-maps'
import * as Location from 'expo-location'
import { runningPageStyles as styles } from './styles'

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
const useWorkoutData = (isPaused, location = null) => {
  const [workoutData, setWorkoutData] = useState({
    pace: '0:00',
    distance: '0.00',
    time: '00:00:00',
  })

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [totalDistance, setTotalDistance] = useState(0) // in meters
  const workoutStartTimeRef = useRef(null)
  const previousLocationRef = useRef(null) // For GPS distance calculation

  // Initialize workout when component mounts or when workout starts
  useEffect(() => {
    if (!workoutStartTimeRef.current) {
      workoutStartTimeRef.current = new Date().toISOString()
      previousLocationRef.current = null
      setTotalDistance(0)
      setElapsedSeconds(0)
    }
  }, [])

  // Timer: Update elapsed time every second
  useEffect(() => {
    if (isPaused) {
      return
    }

    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [isPaused])

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
    
    // Always update previous location, even if we don't add the distance
    // This prevents accumulating noise over multiple updates
    previousLocationRef.current = location
  }, [location, isPaused])

  // Calculate and update derived metrics whenever data changes
  useEffect(() => {
    const {
      calculatePace,
      metersToMiles,
    } = require('./services/healthService')

    // Calculate derived metrics
    const pace = elapsedSeconds > 0 && totalDistance > 0 
      ? calculatePace(totalDistance, elapsedSeconds)
      : '0:00'
    const distanceMiles = metersToMiles(totalDistance)

    // Update workout data
    setWorkoutData({
      pace: pace,
      distance: distanceMiles.toFixed(2),
      time: formatTime(elapsedSeconds),
    })
  }, [elapsedSeconds, totalDistance])

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
        console.error('Error getting location:', error)
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
        console.error('Error setting up location tracking:', error)
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

// Helper function for parsing time (not currently used, but kept for reference)
const parseTime = (timeString) => {
  const parts = timeString.split(':')
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
}

// Helper functions for album art (same as Playlist component)
const getAlbumArtText = (albumArt) => {
  const map = {
    'brat': 'brat',
    'damn': 'DAMN.',
    'tyla': 'T',
    'beyonce': 'B',
    'miley': 'M',
    'pitbull': 'P',
    'lizzo': 'L',
    'dua': 'D'
  }
  return map[albumArt] || 'A'
}

const getAlbumArtColor = (albumArt) => {
  const map = {
    'brat': '#22c55e',
    'damn': '#e5e7eb',
    'tyla': '#fbbf24',
    'beyonce': '#1a1a1a',
    'miley': '#fef3c7',
    'pitbull': '#5809C0',
    'lizzo': '#7BF0FF',
    'dua': '#D3C2F7'
  }
  return map[albumArt] || '#EFEFEF'
}

const getAlbumArtTextColor = (albumArt) => {
  const darkBackgrounds = ['damn', 'beyonce', 'pitbull']
  return darkBackgrounds.includes(albumArt) ? '#FFFFFF' : '#000000'
}

// Helper function to calculate distance between two GPS coordinates (Haversine formula)
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

function RunningPage({ playlistTitle, currentSong, onStop, onPause, onSkip }) {
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false)
  const [isSongPaused, setIsSongPaused] = useState(false)
  const { location, errorMsg, isLoading } = useLocation(isWorkoutPaused)
  const workoutData = useWorkoutData(isWorkoutPaused, location)

  const handleSongPause = () => {
    setIsSongPaused(!isSongPaused)
    // TODO: Implement song playback pause/play functionality
    // This would control the actual music playback
    console.log('Song paused:', !isSongPaused)
  }

  const handleWorkoutPause = () => {
    setIsWorkoutPaused(!isWorkoutPaused)
    if (onPause) onPause(!isWorkoutPaused)
  }

  const handleStop = () => {
    if (onStop) onStop()
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
  }

  const albumArt = currentSong?.albumArt || 'brat'
  const albumArtColor = getAlbumArtColor(albumArt)
  const albumArtTextColor = getAlbumArtTextColor(albumArt)

  return (
    <View style={styles.container}>
      {/* Top Section: Playlist Title, Current Song, Metrics, Controls */}
      <View style={styles.topSection}>
        <Text style={styles.playlistTitle}>{playlistTitle}</Text>
        
        <View style={styles.currentSongSection}>
          <View style={[styles.albumArtSmall, { backgroundColor: albumArtColor }]}>
            <Text style={[styles.albumArtTextSmall, { color: albumArtTextColor }]}>
              {getAlbumArtText(albumArt)}
            </Text>
          </View>
          <View style={styles.songInfo}>
            <View style={styles.songTitleRow}>
              <Text style={styles.songTitle}>{currentSong?.title || 'No song playing'}</Text>
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
            <Text style={styles.songArtist}>{currentSong?.artist || ''}</Text>
            <Text style={styles.songBpm}>BPM: {currentSong?.bpm || 0}</Text>
          </View>
        </View>
      </View>

      {/* Middle Section: Map View */}
      <View style={styles.mapSection}>
        {isLoading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#5809C0" />
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        ) : location ? (
          <MapView
            style={styles.map}
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
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map unavailable</Text>
            {errorMsg && (
              <Text style={styles.mapPlaceholderSubtext}>{errorMsg}</Text>
            )}
          </View>
        )}
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

