import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { playlistStyles as styles } from './styles'
import { generatePlaylist } from './services/playlistService'

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
  // Generate filtered playlist based on distance and intensity preferences
  const songs = useMemo(() => {
    return generatePlaylist(allSongs, distance, intensity)
  }, [distance, intensity])

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

  const renderTrack = ({ item: song }) => {
    const albumArtColor = getAlbumArtColor(song.albumArt)
    const albumArtTextColor = getAlbumArtTextColor(song.albumArt)

    return (
      <View style={styles.trackRow}>
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
      </View>
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

  return (
    <View style={styles.playlistPage}>
      <ScrollView style={styles.scrollView}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.statusIcons}>
            <MaterialIcons name="signal-cellular-4-bar" size={16} color="#5809C0" />
            <MaterialIcons name="wifi" size={16} color="#5809C0" />
            <MaterialIcons name="battery-full" size={16} color="#5809C0" />
          </View>
        </View>

        {/* Playlist Header */}
        <View style={styles.playlistHeader}>
          <View style={styles.playlistInfoSection}>
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

            <View style={styles.playlistDetails}>
              <Text style={styles.playlistTitle}>{getPlaylistTitle()}</Text>
              <Text style={styles.playlistArtists}>
                {artistList}
              </Text>
              <Text style={styles.playlistSummary}>
                {songs.length} songs, {totalMinutes} min
              </Text>

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

              <View style={styles.quickStartSection}>
                <Text style={styles.quickStartText}>Quick start</Text>
                <View style={styles.playControls}>
                  <Pressable style={styles.playButton}>
                    <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={styles.chooseRouteButton}>
                    <Text style={styles.chooseRouteText}>Choose Route</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>

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

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="home" size={24} color="#EFEFEF" />
          <Text style={styles.navLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="people" size={24} color="#EFEFEF" />
          <Text style={styles.navLabel}>Friends</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="directions-run" size={24} color="#5809C0" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Run!</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="bar-chart" size={24} color="#EFEFEF" />
          <Text style={styles.navLabel}>Activity</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <MaterialIcons name="settings" size={24} color="#EFEFEF" />
          <Text style={styles.navLabel}>Settings</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default Playlist

