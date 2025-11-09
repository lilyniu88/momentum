import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

function Playlist({ distance, intensity }) {
  const songs = [
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
        <Text style={styles.trackTimeCol}>{song.time} min</Text>
        <Text style={styles.trackPaceCol}>{song.expectedPace} min/mi</Text>
      </View>
    )
  }

  const totalTime = songs.reduce((sum, song) => {
    const [min, sec] = song.time.split(':').map(Number)
    return sum + min * 60 + sec
  }, 0)
  const totalMinutes = Math.floor(totalTime / 60)

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
              <Text style={styles.playlistTitle}>INTERVAL SPRINT MIX</Text>
              <Text style={styles.playlistArtists}>
                Charli XCX, Pitbull, Kendrick Lamar, Beyoncé, and more
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

const styles = StyleSheet.create({
  playlistPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { minHeight: '100vh' }),
  },
  scrollView: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  playlistHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  playlistInfoSection: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  albumArtGrid: {
    width: 120,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  albumArt: {
    width: '48%',
    height: '48%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  albumArtTextDark: {
    color: '#000000',
  },
  playlistDetails: {
    flex: 1,
    gap: 8,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 28.8,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistArtists: {
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistSummary: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  quickStartText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5809C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseRouteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#5809C0',
    borderRadius: 20,
  },
  chooseRouteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  playlistTracks: {
    padding: 20,
  },
  trackTableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerCol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5809C0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  titleCol: {
    flex: 2,
  },
  bpmCol: {
    flex: 0.8,
  },
  timeCol: {
    flex: 0.8,
  },
  paceCol: {
    flex: 1,
  },
  trackRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    alignItems: 'center',
  },
  trackTitleCol: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Oswald, sans-serif' : undefined,
  },
  trackArtist: {
    fontSize: 14,
    color: '#000000',
    opacity: 0.7,
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackBpmCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackTimeCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  trackPaceCol: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 14,
    color: '#EFEFEF',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  navLabelActive: {
    color: '#5809C0',
  },
})

export default Playlist

