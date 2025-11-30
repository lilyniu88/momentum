import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { getRecentlySelected } from './services/playlistHistoryService'
import Playlist from './Playlist'

// Playlist type definitions
const PLAYLIST_TYPES = [
  {
    id: 'top-tracks',
    label: 'Top Tracks',
    icon: 'trending-up',
    description: 'Your most played songs',
    color: '#5809C0',
  },
  {
    id: 'suggested',
    label: 'Suggested',
    icon: 'lightbulb',
    description: 'Based on your top genres',
    color: '#7BF0FF',
  },
  {
    id: 'genre-pop',
    label: 'Pop',
    icon: 'music-note',
    description: 'Pop running mix',
    genre: 'pop',
    color: '#FF6B9D',
  },
  {
    id: 'genre-rock',
    label: 'Rock',
    icon: 'music-note',
    description: 'Rock running mix',
    genre: 'rock',
    color: '#C44569',
  },
  {
    id: 'genre-hip-hop',
    label: 'Hip-Hop',
    icon: 'music-note',
    description: 'Hip-Hop running mix',
    genre: 'hip-hop',
    color: '#F8B500',
  },
  {
    id: 'genre-electronic',
    label: 'Electronic',
    icon: 'music-note',
    description: 'Electronic running mix',
    genre: 'electronic',
    color: '#00D4FF',
  },
  {
    id: 'genre-indie',
    label: 'Indie',
    icon: 'music-note',
    description: 'Indie running mix',
    genre: 'indie',
    color: '#A8E6CF',
  },
  {
    id: 'genre-country',
    label: 'Country',
    icon: 'music-note',
    description: 'Country running mix',
    genre: 'country',
    color: '#FFD93D',
  },
]

function PlaylistSelection({ distance, intensity, onBack, onRunStart, onRunStop }) {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [recentPlaylists, setRecentPlaylists] = useState([])

  // Load recently selected playlists
  useEffect(() => {
    const loadRecent = async () => {
      const recent = await getRecentlySelected()
      setRecentPlaylists(recent)
    }
    loadRecent()
  }, [])

  const handleSelectPlaylist = (playlistType) => {
    setSelectedPlaylist(playlistType)
  }

  const handleBackToSelection = () => {
    setSelectedPlaylist(null)
  }

  // If a playlist is selected, show Playlist component
  if (selectedPlaylist) {
    return (
      <Playlist
        distance={distance}
        intensity={intensity}
        playlistType={selectedPlaylist}
        onBackToSelection={handleBackToSelection}
        onBackToHome={onBack}
        onRunStart={onRunStart}
        onRunStop={onRunStop}
      />
    )
  }

  // Get display info for playlist types
  const getPlaylistInfo = (id) => {
    return PLAYLIST_TYPES.find(p => p.id === id) || null
  }

  // Filter out recently selected from main list
  const mainPlaylists = PLAYLIST_TYPES.filter(p => !recentPlaylists.includes(p.id))
  const recentPlaylistInfos = recentPlaylists
    .map(id => getPlaylistInfo(id))
    .filter(Boolean)

  // Get labels for display
  const getDistanceLabel = () => {
    const labels = { short: 'Short', medium: 'Medium', long: 'Long' }
    return labels[distance] || distance
  }

  const getIntensityLabel = () => {
    const labels = { low: 'Low', medium: 'Medium', high: 'High' }
    return labels[intensity] || intensity
  }

  return (
    <View style={styles.container}>
      {/* Header with back button and selection info */}
      <View style={styles.header}>
        <View style={styles.backButtonContainer}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000000" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionLabel}>Your Selection:</Text>
          <View style={styles.selectionBadges}>
            <View style={styles.badge}>
              <MaterialIcons name="directions-run" size={16} color="#5809C0" />
              <Text style={styles.badgeText}>{getDistanceLabel()}</Text>
            </View>
            <Text style={styles.badgeSeparator}>•</Text>
            <View style={styles.badge}>
              <MaterialIcons name="fitness-center" size={16} color="#5809C0" />
              <Text style={styles.badgeText}>{getIntensityLabel()}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Playlist</Text>

        {/* Recently Selected Section */}
        {recentPlaylistInfos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <View style={styles.grid}>
              {recentPlaylistInfos.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  style={[styles.playlistCard, { borderColor: playlist.color }]}
                  onPress={() => handleSelectPlaylist(playlist.id)}
                >
                  <MaterialIcons name={playlist.icon} size={32} color={playlist.color} />
                  <Text style={styles.playlistLabel}>{playlist.label}</Text>
                  <Text style={styles.playlistDescription}>{playlist.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Main Playlist Options */}
        <View style={styles.section}>
          {recentPlaylistInfos.length > 0 && (
            <Text style={styles.sectionTitle}>All Playlists</Text>
          )}
          <View style={styles.grid}>
            {mainPlaylists.map((playlist) => (
              <Pressable
                key={playlist.id}
                style={[styles.playlistCard, { borderColor: playlist.color }]}
                onPress={() => handleSelectPlaylist(playlist.id)}
              >
                <MaterialIcons name={playlist.icon} size={32} color={playlist.color} />
                <Text style={styles.playlistLabel}>{playlist.label}</Text>
                <Text style={styles.playlistDescription}>{playlist.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButtonContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  selectionInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  selectionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  selectionBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3C2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
  },
  badgeSeparator: {
    fontSize: 18,
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5809C0',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5809C0',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  playlistCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  playlistDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
}

export default PlaylistSelection

