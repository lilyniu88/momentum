import React, { useMemo, useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { playlistStyles as styles } from './styles'
import { generatePlaylist } from './services/playlistService'
import RunningPage from './RunningPage'
import {
  useAuthRequest,
  exchangeCodeForTokens,
  saveTokens,
  isAuthenticated,
  getValidAccessToken,
  clearTokens,
  getRedirectUri,
} from './services/spotifyAuth'
import { fetchTopTracksWithFeatures, getAlbumCoverArt, startPlayback, getAvailableDevices, transferPlayback } from './services/spotifyApi'

function Playlist({ distance, intensity }) {
  const [showRunningPage, setShowRunningPage] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [authReady, setAuthReady] = useState(false)
  const [spotifySongs, setSpotifySongs] = useState([])
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [albumArtUrls, setAlbumArtUrls] = useState({})
  const [hasActiveDevice, setHasActiveDevice] = useState(null) // null = unknown, true/false = checked

  const [request, response, promptAsync] = useAuthRequest()

  // Check authentication on mount
  useEffect(() => {
    checkAuthAndFetchTracks()
  }, [])

  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response.params.code, request?.codeVerifier)
    } else if (response?.type === 'error') {
      console.error('OAuth error:', response.error)
      const errorMsg = response.error?.message || response.error?.error || 'Unknown error'
      setAuthError(`Authentication failed: ${errorMsg}`)
      
      // If it's an invalid redirect URI error, provide helpful message
      if (errorMsg.includes('redirect_uri') || errorMsg.includes('redirect')) {
        setAuthError(`Invalid redirect URI. Check console for the exact URI and add it to Spotify Dashboard. Error: ${errorMsg}`)
      }
      
      setIsLoadingSpotify(false)
    }
  }, [response, request])

  // Check if user is authenticated and fetch tracks
  const checkAuthAndFetchTracks = async () => {
    try {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        setAuthReady(true)
        await fetchSpotifyTracks()
      } else {
        setAuthReady(false)
      }
    } catch (error) {
      console.error('Error checking authentication:', error)
      setAuthReady(false)
    }
  }

  // Handle successful authentication
  const handleAuthSuccess = async (code, codeVerifier) => {
    try {
      setIsLoadingSpotify(true)
      setAuthError(null)
      
      const redirectUri = request?.redirectUri || getRedirectUri()
      const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri)
      await saveTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn)
      
      setAuthReady(true)
      await fetchSpotifyTracks()
    } catch (error) {
      console.error('Error during authentication:', error)
      setAuthError(`Failed to authenticate: ${error.message}`)
      setIsLoadingSpotify(false)
    }
  }

  // Check for available devices
  const checkDevices = async () => {
    try {
      const devices = await getAvailableDevices()
      const activeDevice = devices.find(device => device.is_active)
      const hasDevice = activeDevice !== undefined
      setHasActiveDevice(hasDevice)
      return hasDevice
    } catch (error) {
      setHasActiveDevice(false)
      return false
    }
  }

  // Fetch top tracks from Spotify
  const fetchSpotifyTracks = async () => {
    try {
      setIsLoadingSpotify(true)
      setAuthError(null)
      
      const tracks = await fetchTopTracksWithFeatures({
        time_range: 'short_term',
        limit: 50,
      })
      
      setSpotifySongs(tracks || [])
      setIsLoadingSpotify(false)
      
      // Check for devices after tracks are loaded (for UI display only)
      await checkDevices()
    } catch (error) {
      console.error('Error fetching Spotify tracks:', error)
      setAuthError(`Failed to fetch tracks: ${error.message}`)
      setIsLoadingSpotify(false)
      
      if (error.message.includes('Authentication failed')) {
        await clearTokens()
        setAuthReady(false)
      }
    }
  }

  // Handle Spotify connect button
  const handleConnectSpotify = async () => {
    try {
      setIsLoadingSpotify(true)
      setAuthError(null)
      
      if (!request) {
        setAuthError('OAuth request not ready. Please check your CLIENT_ID in .env file.')
        setIsLoadingSpotify(false)
        return
      }
      
      await promptAsync()
    } catch (error) {
      console.error('Error prompting auth:', error)
      setAuthError(`Failed to start authentication: ${error.message}`)
      setIsLoadingSpotify(false)
    }
  }


  // Use only Spotify songs (no hardcoded fallback)
  const availableSongs = spotifySongs

  const songs = useMemo(() => {
    if (availableSongs.length === 0) {
      return []
    }
    
    const filtered = generatePlaylist(availableSongs, distance, intensity)
    
    if (spotifySongs.length > 0 && filtered.length === 0) {
      return availableSongs
    }
    
    return filtered
  }, [availableSongs, distance, intensity, spotifySongs.length])

  // Fetch album cover art for songs
  useEffect(() => {
    const fetchAlbumArt = async () => {
      const urls = {}
      const uniqueAlbumIds = [...new Set(songs
        .filter(song => song.albumId && !song.albumImageUrl)
        .map(song => song.albumId)
      )]
      
      // Fetch album art for albums that don't already have image URLs
      for (const albumId of uniqueAlbumIds.slice(0, 20)) { // Limit to 20 to avoid too many requests
        try {
          const imageUrl = await getAlbumCoverArt(albumId)
          if (imageUrl) {
            urls[albumId] = imageUrl
          }
        } catch (error) {
          console.warn(`Failed to fetch album art for ${albumId}:`, error)
        }
      }
      
      setAlbumArtUrls(prev => ({ ...prev, ...urls }))
    }
    
    if (songs.length > 0) {
      fetchAlbumArt()
    }
  }, [songs])

  const currentSong = songs[currentSongIndex] || songs[0]

  // Generate playlist title based on filters
  const getPlaylistTitle = () => {
    const intensityLabels = {
      low: 'EASY',
      medium: 'MODERATE',
      high: 'INTENSE'
    }
    const distanceLabels = {
      short: 'SHORT',
      medium: 'MEDIUM',
      long: 'LONG'
    }
    const intensityLabel = intensityLabels[intensity] || 'RUN'
    const distanceLabel = distanceLabels[distance] || 'RUN'
    return `${intensityLabel} ${distanceLabel} MIX`
  }

  const handlePlay = async () => {
    if (songs.length > 0 && songs[0]?.spotifyUri) {
      try {
        // Always check for available devices when play is clicked
        const devices = await getAvailableDevices()
        
        if (devices.length === 0) {
          setAuthError('No devices available. Please open Spotify on your phone, computer, or web player, then try again.')
          setHasActiveDevice(false)
          return
        }
        
        // Find active device or use first available device
        let targetDevice = devices.find(device => device.is_active)
        
        // If no active device, transfer playback to first available device
        if (!targetDevice) {
          targetDevice = devices[0]
          try {
            await transferPlayback(targetDevice.id, false)
          } catch (transferError) {
            // If transfer fails, still try to start playback - Spotify might handle it
          }
        }
        
        // Reset to first song when starting playback
        setCurrentSongIndex(0)
        
        // Start playback from the first song (index 0)
        const allUris = songs.map(song => song.spotifyUri).filter(Boolean)
        await startPlayback({
          uris: allUris,
          offset: { position: 0 },
          positionMs: 0,
          deviceId: targetDevice.id,
        })
        
        setHasActiveDevice(true)
        setAuthError(null)
      } catch (error) {
        const isNonCriticalError = error.message.includes('non-critical') || 
                                  error.message.includes('devices');
        const isPlaybackError = error.message.includes('Missing permissions') && 
                                !isNonCriticalError;
        
        if (error.message.includes('No valid access token') || error.message.includes('Authentication required') || error.code === 'AUTH_REQUIRED') {
          setAuthError('Authentication required. Please disconnect and reconnect Spotify.')
          return
        }
        if (isPlaybackError || (error.message.includes('Missing permissions') && error.message.includes('playback'))) {
          setAuthError('Missing permissions: Please disconnect and reconnect Spotify to enable playback.')
          return
        }
        if (error.message.includes('No active device') || error.reason === 'NO_ACTIVE_DEVICE' || error.code === 'NO_ACTIVE_DEVICE') {
          setAuthError('No active device found. Please open Spotify on your phone, computer, or web player, then try again.')
          setHasActiveDevice(false)
          return
        }
      }
    }
    setShowRunningPage(true)
  }

  const handleStop = () => {
    setShowRunningPage(false)
    setCurrentSongIndex(0)
  }

  const handleSkip = () => {
    setCurrentSongIndex((prev) => (prev + 1) % songs.length)
  }

  // Show running page if play button was clicked
  if (showRunningPage) {
    return (
      <RunningPage
        playlistTitle={getPlaylistTitle()}
        currentSong={currentSong}
        currentSongIndex={currentSongIndex}
        allSongs={songs}
        onStop={handleStop}
        onPause={() => {}}
        onSkip={handleSkip}
      />
    )
  }

  const getAlbumArtText = (albumArt, title) => {
    // If albumArt is a URL (from Spotify), use first letter of title
    if (typeof albumArt === 'string' && albumArt.startsWith('http')) {
      return title?.charAt(0)?.toUpperCase() || '♪'
    }
    // Otherwise use first letter of title
    return title?.charAt(0)?.toUpperCase() || 'A'
  }

  const getAlbumArtColor = (albumArt) => {
    // Use default color for all tracks (Spotify tracks will have URLs)
    return '#EFEFEF'
  }

  // Open track in Spotify
  const openTrackInSpotify = async (song) => {
    if (song.spotifyUri) {
      const spotifyUri = song.spotifyUri
      const canOpen = await Linking.canOpenURL(spotifyUri)
      
      if (canOpen) {
        await Linking.openURL(spotifyUri)
      } else if (song.spotifyUrl) {
        // Fallback to web URL
        await Linking.openURL(song.spotifyUrl)
      }
    } else if (song.spotifyUrl) {
      await Linking.openURL(song.spotifyUrl)
    }
  }

  const renderTrack = ({ item: song }) => {
    // Get album image URL - prefer albumImageUrl from track, then fetched URL, then fallback
    const albumImageUrl = song.albumImageUrl || (song.albumId ? albumArtUrls[song.albumId] : null)
    const albumArtColor = getAlbumArtColor(song.albumArt)
    const albumArtText = getAlbumArtText(song.albumArt, song.title)

    return (
      <Pressable 
        style={styles.trackRow}
        onPress={() => {
          if (song.spotifyUri || song.spotifyUrl) {
            openTrackInSpotify(song)
          }
        }}
      >
        <View style={styles.trackTitleCol}>
          <View style={[styles.trackThumbnail, { backgroundColor: albumArtColor }]}>
            {albumImageUrl ? (
              <Image 
                source={{ uri: albumImageUrl }} 
                style={{ width: '100%', height: '100%', borderRadius: 4 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.thumbnailText, { color: '#000000' }]}>
                {albumArtText}
              </Text>
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackName}>{song.title}</Text>
            <Text style={styles.trackArtist}>{song.artist}</Text>
          </View>
        </View>
        <Text style={styles.trackBpmCol}>{song.bpm}</Text>
        <Text style={styles.trackTimeCol}>{song.time}</Text>
        <Text style={styles.trackPaceCol}>{song.expectedPace} min/mi</Text>
      </Pressable>
    )
  }

  const totalTime = songs.reduce((sum, song) => {
    const [min, sec] = song.time.split(':').map(Number)
    return sum + min * 60 + sec
  }, 0)
  const totalMinutes = Math.floor(totalTime / 60)

  // Get unique artists from filtered songs
  const uniqueArtists = [...new Set(songs.map(song => song.artist))]
  const artistList = uniqueArtists.length > 0 
    ? uniqueArtists.slice(0, 4).join(', ') + (uniqueArtists.length > 4 ? ', and more' : '')
    : 'No songs available'

  return (
    <View style={styles.playlistPage}>
      <ScrollView style={styles.scrollView}>
        {/* Playlist Header */}
      <View style={styles.playlistHeader}>
        <View style={styles.playlistInfoSection}>
          <View>
          <View style={styles.albumArtGrid}>
              {/* Show first 4 tracks' album art or placeholder */}
              {songs.slice(0, 4).map((song, index) => {
                const albumImageUrl = song.albumImageUrl || (song.albumId ? albumArtUrls[song.albumId] : null)
                return (
                  <View key={song.id || index} style={[styles.albumArt, { backgroundColor: '#EFEFEF', overflow: 'hidden' }]}>
                    {albumImageUrl ? (
                      <Image 
                        source={{ uri: albumImageUrl }} 
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[styles.albumArtText, { color: '#000000' }]}>
                        {song.title?.charAt(0)?.toUpperCase() || '♪'}
                      </Text>
                    )}
            </View>
                )
              })}
              {/* Fill remaining slots if less than 4 songs */}
              {Array.from({ length: Math.max(0, 4 - songs.length) }).map((_, index) => (
                <View key={`placeholder-${index}`} style={[styles.albumArt, { backgroundColor: '#EFEFEF' }]}>
                  <Text style={[styles.albumArtText, { color: '#000000' }]}>♪</Text>
            </View>
              ))}
            </View>
            <Text style={styles.playlistSummary}>
              {songs.length} songs, {totalMinutes} min
            </Text>
          </View>

          <View style={styles.playlistDetails}>
            <Text style={styles.playlistTitle}>
              {getPlaylistTitle()}
            </Text>
            <Text style={styles.playlistArtists}>
              {artistList}
            </Text>
          </View>
        </View>
      </View>

        {/* Spotify Connect Button or Action Buttons */}
        {!authReady ? (
          <View style={styles.spotifyConnectSection}>
            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
                {(authError.includes('Missing permissions') || authError.includes('Permissions missing')) ? (
                  <Text style={styles.redirectUriHint}>
                    Please reconnect Spotify to grant playback permissions.
                  </Text>
                ) : null}
                {request?.redirectUri && (
                  <>
                    <Text style={styles.redirectUriHint}>
                      Redirect URI: {request.redirectUri}
                    </Text>
                    <Text style={styles.redirectUriHint}>
                      Make sure this EXACT URI is added to your Spotify Dashboard
                    </Text>
                  </>
                )}
              </View>
            )}
            {isLoadingSpotify ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5809C0" />
                <Text style={styles.loadingText}>Connecting to Spotify...</Text>
              </View>
            ) : (
              <>
                <Pressable 
                  style={styles.spotifyConnectButton} 
                  onPress={handleConnectSpotify}
                  disabled={!request}
                >
                  <MaterialIcons name="music-note" size={24} color="#FFFFFF" />
                  <Text style={styles.spotifyConnectText}>Connect Spotify</Text>
                </Pressable>
                {request?.redirectUri && (
                  <Text style={styles.redirectUriDisplay}>
                    Redirect URI: {request.redirectUri}
                  </Text>
                )}
              </>
            )}
            <Text style={styles.spotifyConnectHint}>
              Connect to see your top tracks sorted by BPM
            </Text>
          </View>
        ) : (
                <View style={styles.playlistActionsRow}>
                  <View style={styles.actionButtonsRow}>
                    <Pressable style={styles.actionIconBtn}>
                      <MaterialIcons name="favorite-border" size={20} color="#5809C0" />
                    </Pressable>
                    <Pressable style={styles.actionIconBtn}>
                      <MaterialIcons name="download" size={20} color="#5809C0" />
                    </Pressable>
                  </View>
                  <Pressable style={styles.playButton} onPress={handlePlay}>
                    <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                  </Pressable>
                </View>
        )}

        {/* Show error message even when authenticated */}
        {authReady && authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{authError}</Text>
                  {(authError.includes('Missing permissions') || authError.includes('Permissions missing')) ? (
                    <Text style={styles.redirectUriHint}>
                      Please reconnect Spotify to grant playback permissions.
                    </Text>
                  ) : (authError.includes('Authentication required') || authError.includes('No valid access token')) ? (
                    <Text style={styles.redirectUriHint}>
                      Please reconnect Spotify.
                    </Text>
                  ) : (authError.includes('No active device')) ? (
                    <Text style={styles.redirectUriHint}>
                      Open Spotify on your phone, computer, or web player, then try playing again.
                    </Text>
                  ) : null}
            </View>
        )}
        
        {/* Show device status warning */}
        {authReady && !isLoadingSpotify && hasActiveDevice === false && !authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No active Spotify device found</Text>
            <Text style={styles.redirectUriHint}>
              Open Spotify on your phone, computer, or web player to enable playback.
            </Text>
          </View>
        )}

        {/* Loading indicator for Spotify tracks */}
        {authReady && isLoadingSpotify && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5809C0" />
            <Text style={styles.loadingText}>Loading your top tracks...</Text>
        </View>
        )}

        {/* Song List */}
      <View style={styles.playlistTracks}>
        <View style={styles.trackTableHeader}>
          <Text style={[styles.headerCol, styles.titleCol]}>Title</Text>
          <Text style={[styles.headerCol, styles.bpmCol]}>BPM</Text>
          <Text style={[styles.headerCol, styles.timeCol]}>Time</Text>
          <Text style={[styles.headerCol, styles.paceCol]}>Expected Pace</Text>
        </View>

        <FlatList
          data={songs}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
    </View>
  )
}

export default Playlist

