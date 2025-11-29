import React, { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { deleteRun } from './services/runDataService'
import { runDetailStyles as styles } from './styles'

/**
 * Convert seconds per mile to pace string
 */
const secondsToPace = (seconds) => {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function RunDetail({ run, onBack }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const formatTime = (timeString) => {
    // Time is already in HH:MM:SS format from RunningPage
    return timeString || '00:00:00'
  }

  // Calculate fastest and slowest pace songs from samples
  const { fastestSong, slowestSong, songsPlayed } = useMemo(() => {
    if (!run.samples || run.samples.length === 0) {
      return { fastestSong: null, slowestSong: null, songsPlayed: 0 }
    }

    // Get unique songs
    const uniqueSongs = new Map()
    run.samples.forEach(sample => {
      if (sample.song && sample.song.title) {
        const key = `${sample.song.title}-${sample.song.artist}`
        if (!uniqueSongs.has(key)) {
          uniqueSongs.set(key, {
            title: sample.song.title,
            artist: sample.song.artist,
            bpm: sample.song.bpm || 0,
            paces: [],
          })
        }
        if (sample.pace > 0) {
          uniqueSongs.get(key).paces.push(sample.pace)
        }
      }
    })

    // Calculate average pace per song
    const songsWithAvgPace = Array.from(uniqueSongs.values()).map(song => ({
      ...song,
      avgPace: song.paces.length > 0
        ? song.paces.reduce((sum, p) => sum + p, 0) / song.paces.length
        : 0,
    }))

    // Filter out songs with no valid pace
    const validSongs = songsWithAvgPace.filter(s => s.avgPace > 0)

    if (validSongs.length === 0) {
      return { fastestSong: null, slowestSong: null, songsPlayed: uniqueSongs.size }
    }

    // Find fastest (lowest pace seconds) and slowest (highest pace seconds)
    const fastest = validSongs.reduce((min, song) => 
      song.avgPace < min.avgPace ? song : min
    )
    const slowest = validSongs.reduce((max, song) => 
      song.avgPace > max.avgPace ? song : max
    )

    return {
      fastestSong: fastest,
      slowestSong: slowest,
      songsPlayed: uniqueSongs.size,
    }
  }, [run.samples])

  const handleDelete = async () => {
    try {
      await deleteRun(run.id)
      if (onBack) {
        onBack()
      }
    } catch (error) {
      console.error('Error deleting run:', error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Run Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <Text style={styles.sectionValue}>{formatDate(run.date)}</Text>
        </View>

        {/* Total Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Distance</Text>
          <Text style={styles.sectionValue}>
            {run.totalDistance ? `${parseFloat(run.totalDistance).toFixed(2)} miles` : '0.00 miles'}
          </Text>
        </View>

        {/* Total Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Time</Text>
          <Text style={styles.sectionValue}>{formatTime(run.totalTime)}</Text>
        </View>

        {/* Number of Songs Played */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Songs Played</Text>
          <Text style={styles.sectionValue}>{songsPlayed}</Text>
        </View>

        {/* Average Pace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Pace</Text>
          <Text style={styles.sectionValue}>
            {run.averagePace || (run.samples && run.samples.length > 0
              ? (() => {
                  const validPaces = run.samples.filter(s => s.pace > 0).map(s => s.pace)
                  if (validPaces.length === 0) return '0:00'
                  const avgPace = validPaces.reduce((sum, p) => sum + p, 0) / validPaces.length
                  return secondsToPace(avgPace)
                })()
              : '0:00')}{' '}
            min/mi
          </Text>
        </View>

        {/* Fastest Pace Song */}
        {fastestSong && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-up" size={20} color="#5809C0" />
              <Text style={styles.sectionTitle}>Fastest Pace Song</Text>
            </View>
            <View style={styles.songCard}>
              <Text style={styles.songTitle}>{fastestSong.title}</Text>
              <Text style={styles.songArtist}>{fastestSong.artist}</Text>
              <Text style={styles.songPace}>
                {secondsToPace(fastestSong.avgPace)} min/mi
              </Text>
            </View>
          </View>
        )}

        {/* Slowest Pace Song */}
        {slowestSong && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-down" size={20} color="#5809C0" />
              <Text style={styles.sectionTitle}>Slowest Pace Song</Text>
            </View>
            <View style={styles.songCard}>
              <Text style={styles.songTitle}>{slowestSong.title}</Text>
              <Text style={styles.songArtist}>{slowestSong.artist}</Text>
              <Text style={styles.songPace}>
                {secondsToPace(slowestSong.avgPace)} min/mi
              </Text>
            </View>
          </View>
        )}

        {/* Delete Button */}
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete Run</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

export default RunDetail

