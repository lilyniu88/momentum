import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native'

function Playlist() {
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
    }
  ]

  const renderTrack = ({ item: song }) => {
    const getAlbumArtText = () => {
      if (song.albumArt === 'brat') return 'brat'
      if (song.albumArt === 'damn') return 'DAMN.'
      if (song.albumArt === 'tyla') return 'T'
      return 'B'
    }

    const getThumbnailStyle = () => {
      if (song.albumArt === 'brat') return styles.thumbnailBrat
      if (song.albumArt === 'damn') return styles.thumbnailDamn
      if (song.albumArt === 'tyla') return styles.thumbnailTyla
      return styles.thumbnailBeyonce
    }

    return (
      <View style={styles.trackRow}>
        <View style={styles.trackTitleCol}>
          <View style={[styles.trackThumbnail, getThumbnailStyle()]}>
            <Text style={styles.thumbnailText}>{getAlbumArtText()}</Text>
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

  return (
    <ScrollView style={styles.playlistPage}>
      <View style={styles.playlistHeader}>
        <View style={styles.statusBar}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.statusIcons}>
            <Text style={styles.icon}>📶</Text>
            <Text style={styles.icon}>📶</Text>
            <Text style={styles.icon}>🔋</Text>
          </View>
        </View>

        <View style={styles.playlistInfoSection}>
          <View style={styles.albumArtGrid}>
            <View style={[styles.albumArt, styles.albumArtBrat]}>
              <Text style={styles.albumArtText}>brat</Text>
            </View>
            <View style={[styles.albumArt, styles.albumArtDamn]}>
              <Text style={[styles.albumArtText, styles.albumArtTextDark]}>DAMN.</Text>
            </View>
            <View style={[styles.albumArt, styles.albumArtFuturistic]}>
              <Text style={styles.albumArtText}>F</Text>
            </View>
            <View style={[styles.albumArt, styles.albumArtLight]}>
              <Text style={[styles.albumArtText, styles.albumArtTextDark]}>L</Text>
            </View>
          </View>

          <View style={styles.playlistDetails}>
            <Text style={styles.playlistTitle}>INTERVAL SPRINT MIX</Text>
            <Text style={styles.playlistArtists}>Charli XCX, Pitbull, Kendrick Lamar, Beyoncé, and more</Text>
            <Text style={styles.playlistSummary}>10 songs, 30 min</Text>

            <View style={styles.actionButtonsRow}>
              <Pressable style={styles.actionIconBtn}>
                <Text style={styles.actionIconText}>♡</Text>
              </Pressable>
              <Pressable style={styles.actionIconBtn}>
                <Text style={styles.actionIconText}>⬇</Text>
              </Pressable>
              <Pressable style={styles.actionIconBtn}>
                <Text style={styles.actionIconText}>⋯</Text>
              </Pressable>
            </View>

            <View style={styles.quickStartSection}>
              <Text style={styles.quickStartText}>Quick start</Text>
              <View style={styles.playControls}>
                <Pressable style={styles.playButton}>
                  <Text style={styles.playIcon}>▶</Text>
                </Pressable>
                <Pressable style={styles.chooseRouteButton}>
                  <Text style={styles.chooseRouteText}>Choose Route</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>

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
  )
}

const styles = StyleSheet.create({
  playlistPage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    fontSize: 14,
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
  albumArtBrat: {
    backgroundColor: '#22c55e',
  },
  albumArtDamn: {
    backgroundColor: '#e5e7eb',
  },
  albumArtFuturistic: {
    backgroundColor: '#1f2937',
  },
  albumArtLight: {
    backgroundColor: '#fef3c7',
  },
  albumArtText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  playlistArtists: {
    fontSize: 14,
    color: '#000000',
  },
  playlistSummary: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
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
  actionIconText: {
    fontSize: 16,
    color: '#5809C0',
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
  playIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 2,
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
  thumbnailBrat: {
    backgroundColor: '#4ade80',
  },
  thumbnailDamn: {
    backgroundColor: '#5809C0',
  },
  thumbnailTyla: {
    backgroundColor: '#fbbf24',
  },
  thumbnailBeyonce: {
    backgroundColor: '#1a1a1a',
  },
  thumbnailText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  trackArtist: {
    fontSize: 12,
    color: '#000000',
    opacity: 0.7,
  },
  trackBpmCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
  },
  trackTimeCol: {
    flex: 0.8,
    fontSize: 14,
    color: '#000000',
  },
  trackPaceCol: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
})

export default Playlist
