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
import { generatePlaylist } from './services/playlistService'
import RunningPage from './RunningPage'
import {
  useAuthRequest,
  exchangeCodeForTokens,
  saveTokens,
  isAuthenticated,
  getValidAccessToken,
  clearTokens,
} from './services/spotifyAuth'
import { fetchTopTracksWithFeatures } from './services/spotifyApi'

// All available songs (in a real app, this would come from Spotify API)
const allSongs = [
    {
      id: 1,
      title: "360",
      artist: "Charli XCX",
      bpm: 181,
      time: "2:14",
      expectedPace: "6:14",
      albumArt: "brat"
    },
    {
      id: 2,
      title: "HUMBLE.",
      artist: "Kendrick Lamar",
      bpm: 182,
      time: "2:57",
      expectedPace: "6:09",
      albumArt: "damn"
    },
    {
      id: 3,
      title: "IS IT",
      artist: "Tyla",
      bpm: 189,
      time: "2:44",
      expectedPace: "6:08",
      albumArt: "tyla"
    },
    {
      id: 4,
      title: "MY HOUSE",
      artist: "Beyoncé",
      bpm: 142,
      time: "4:23",
      expectedPace: "9:23",
      albumArt: "beyonce"
    },
    {
      id: 5,
      title: "DNA.",
      artist: "Kendrick Lamar",
      bpm: 140,
      time: "3:06",
      expectedPace: "9:42",
      albumArt: "damn"
    },
    {
      id: 6,
      title: "365",
      artist: "Charli XCX",
      bpm: 181,
      time: "2:18",
      expectedPace: "6:12",
      albumArt: "brat"
  },
  {
    id: 7,
    title: "Party in the U.S.A.",
    artist: "Miley Cyrus",
    bpm: 100,
    time: "3:22",
    expectedPace: "10:00",
    albumArt: "miley"
  },
  {
    id: 8,
    title: "Fireball",
    artist: "Pitbull",
    bpm: 128,
    time: "3:24",
    expectedPace: "8:00",
    albumArt: "pitbull"
  },
  {
    id: 9,
    title: "Good as Hell",
    artist: "Lizzo",
    bpm: 120,
    time: "2:39",
    expectedPace: "8:30",
    albumArt: "lizzo"
  },
  {
    id: 10,
    title: "Levitating",
    artist: "Dua Lipa",
    bpm: 103,
    time: "3:23",
    expectedPace: "9:45",
    albumArt: "dua"
  }
]

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
      
      const tokens = await exchangeCodeForTokens(code, codeVerifier)
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
      
      const tracks = await fetchTopTracksWithFeatures({
        time_range: 'short_term',
        limit: 50,
      })
      
      setSpotifySongs(tracks)
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

  // Use Spotify songs if available, otherwise fallback to allSongs
  const availableSongs = spotifySongs.length > 0 ? spotifySongs : allSongs

  // Generate filtered playlist based on distance and intensity preferences
  const songs = useMemo(() => {
    return generatePlaylist(availableSongs, distance, intensity)
  }, [availableSongs, distance, intensity])

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

  const getAlbumArtText = (albumArt) => {
    // If albumArt is a URL (from Spotify), extract first letter from URL or use default
    if (typeof albumArt === 'string' && albumArt.startsWith('http')) {
      return '♪'
    }
    
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
    // If albumArt is a URL (from Spotify), use default color
    if (typeof albumArt === 'string' && albumArt.startsWith('http')) {
      return '#5809C0'
    }
    
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

  const getAlbumArtTextColor = (albumArt) => {
    const darkBackgrounds = ['damn', 'beyonce', 'pitbull']
    return darkBackgrounds.includes(albumArt) ? '#FFFFFF' : '#000000'
  }

  const renderTrack = ({ item: song }) => {
    const albumArtColor = getAlbumArtColor(song.albumArt)
    const albumArtTextColor = getAlbumArtTextColor(song.albumArt)

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
            <Text style={[styles.thumbnailText, { color: albumArtTextColor }]}>
              {getAlbumArtText(song.albumArt)}
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
              <View style={[styles.albumArt, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.albumArtText}>brat</Text>
              </View>
              <View style={[styles.albumArt, { backgroundColor: '#e5e7eb' }]}>
                <Text style={[styles.albumArtText, styles.albumArtTextDark]}>DAMN.</Text>
              </View>
              <View style={[styles.albumArt, { backgroundColor: '#1f2937' }]}>
                <Text style={styles.albumArtText}>F</Text>
              </View>
              <View style={[styles.albumArt, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.albumArtText, styles.albumArtTextDark]}>L</Text>
              </View>
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
    </ScrollView>
    </View>
  )
}

export default Playlist

