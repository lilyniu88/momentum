import React, { useMemo, useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { playlistStyles as styles } from './styles'
import { generatePlaylist, fetchAndFilterPlaylist } from './services/playlistService'
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
import { getTopTracks } from './services/spotifyApi'

function Playlist({ distance, intensity }) {
  const [showRunningPage, setShowRunningPage] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [authReady, setAuthReady] = useState(false)
  const [spotifySongs, setSpotifySongs] = useState([])
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Spotify OAuth
  const [request, response, promptAsync] = useAuthRequest()
  
  // Log redirect URI on mount for debugging
  useEffect(() => {
    if (request) {
      console.log('OAuth Request ready. Redirect URI:', request.redirectUri);
    }
  }, [request])

  // Check authentication on mount
  useEffect(() => {
    checkAuthAndFetchTracks()
  }, [])

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('OAuth success! Exchanging code for tokens...')
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
      
      // Use the EXACT redirect URI from the request to ensure it matches
      const redirectUri = request?.redirectUri || getRedirectUri()
      console.log('Using redirect URI for token exchange:', redirectUri)
      
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

  // Fetch top tracks from Spotify
  const fetchSpotifyTracks = async () => {
    try {
      setIsLoadingSpotify(true)
      setAuthError(null)
      
      // Get raw tracks from Spotify (without BPM data)
      const rawTracks = await getTopTracks({
        time_range: 'short_term',
        limit: 50,
      })
      
      console.log(`Retrieved ${rawTracks?.length || 0} tracks from Spotify`)
      
      // Fetch BPMs and filter by distance/intensity in playlistService
      const filteredTracks = await fetchAndFilterPlaylist(
        rawTracks || [],
        distance,
        intensity
      )
      
      console.log(`Loaded ${filteredTracks?.length || 0} filtered tracks`)
      setSpotifySongs(filteredTracks || [])
      setIsLoadingSpotify(false)
    } catch (error) {
      console.error('Error fetching Spotify tracks:', error)
      setAuthError(`Failed to fetch tracks: ${error.message}`)
      setIsLoadingSpotify(false)
      
      // If authentication failed, clear tokens and reset auth state
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
      
      console.log('Starting Spotify OAuth with redirect URI:', request.redirectUri)
      await promptAsync()
    } catch (error) {
      console.error('Error prompting auth:', error)
      setAuthError(`Failed to start authentication: ${error.message}`)
      setIsLoadingSpotify(false)
    }
  }

  // Songs are already filtered by fetchAndFilterPlaylist
  // But if distance/intensity props change, we need to re-filter
  const songs = useMemo(() => {
    // If no songs available, return empty array
    if (spotifySongs.length === 0) {
      return []
    }
    
    // Re-filter if distance/intensity changed (tracks already have BPM data)
    return generatePlaylist(spotifySongs, distance, intensity)
  }, [spotifySongs, distance, intensity])

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

  const handlePlay = () => {
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
            <Text style={[styles.thumbnailText, { color: '#000000' }]}>
              {albumArtText}
            </Text>
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
              {songs.slice(0, 4).map((song, index) => (
                <View key={song.id || index} style={[styles.albumArt, { backgroundColor: '#EFEFEF' }]}>
                  <Text style={[styles.albumArtText, { color: '#000000' }]}>
                    {song.title?.charAt(0)?.toUpperCase() || '♪'}
                  </Text>
                </View>
              ))}
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
              <Pressable style={styles.actionIconBtn}>
                <MaterialIcons name="more-vert" size={20} color="#5809C0" />
              </Pressable>
            </View>
            <Pressable style={styles.playButton} onPress={handlePlay}>
              <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
            </Pressable>
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

        {/* GetSong BPM API Credit Footer */}
        <View style={styles.creditFooter}>
          <Text style={styles.creditText}>
            BPM data powered by{' '}
            <Text 
              style={styles.creditLink}
              onPress={() => Linking.openURL('https://getsongbpm.com')}
            >
              GetSong BPM
            </Text>
          </Text>
        </View>
    </ScrollView>
    </View>
  )
}

export default Playlist

