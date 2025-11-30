import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { deleteRun } from './services/runDataService'
import { runDetailStyles as styles } from './styles'

const screenWidth = Dimensions.get('window').width

/**
 * Convert seconds per mile to pace string
 */
const secondsToPace = (seconds) => {
  if (!seconds || seconds === 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Convert pace string (e.g., "6:30") to seconds per mile
 */
const paceToSeconds = (paceString) => {
  if (paceString === '0:00') return 0
  const [minutes, seconds] = paceString.split(':').map(Number)
  return minutes * 60 + seconds
}

function RunDetail({ run, onBack }) {
  const [selectedPoint, setSelectedPoint] = useState(null)

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

  // Prepare chart data for inline graph
  const { chartData, yAxisLabels, totalDistance } = useMemo(() => {
    const samples = run.samples || []
    
    if (samples.length === 0) {
      return {
        chartData: { labels: [], datasets: [{ data: [] }] },
        yAxisLabels: [],
        totalDistance: run.totalDistance || 0.1
      }
    }

    const labels = []
    const data = []

    samples.forEach((sample) => {
      data.push(sample.pace)
      labels.push(sample.distance.toFixed(2))
    })

    // Calculate Y-axis range
    const validPaces = data.filter(p => p > 0)
    const minPace = validPaces.length > 0 ? Math.min(...validPaces) : 0
    const maxPace = validPaces.length > 0 ? Math.max(...validPaces) : 600
    const range = maxPace - minPace
    const padding = range > 0 ? range * 0.1 : 60
    const yMin = Math.max(0, minPace - padding)
    const yMax = maxPace + padding
    const yRange = yMax - yMin

    // Generate formatted Y-axis labels
    const numSegments = 5
    const yAxisLabels = []
    for (let i = 0; i <= numSegments; i++) {
      const value = yMax - (yRange * i / numSegments)
      const mins = Math.floor(value / 60)
      const secs = Math.floor(value % 60)
      yAxisLabels.push({
        value: value,
        label: `${mins}:${String(secs).padStart(2, '0')}`,
        position: i / numSegments,
      })
    }

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(88, 9, 192, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
      yAxisLabels,
      totalDistance: run.totalDistance || Math.max(0.1, samples[samples.length - 1]?.distance || 0.1)
    }
  }, [run.samples, run.totalDistance])

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(88, 9, 192, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, 0)`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#5809C0',
    },
  }

  // Find nearest sample for tap detection
  const findNearestSample = (targetDistance) => {
    const samples = run.samples || []
    if (samples.length === 0) return null
    
    let nearest = samples[0]
    let minDiff = Math.abs(nearest.distance - targetDistance)
    
    for (const sample of samples) {
      const diff = Math.abs(sample.distance - targetDistance)
      if (diff < minDiff) {
        minDiff = diff
        nearest = sample
      }
    }
    
    return nearest
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

        {/* Pace Graph */}
        {run.samples && run.samples.length > 0 && (
          <View style={styles.graphSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="chart-line" size={20} color="#5809C0" style={styles.sectionIcon} solid />
              <Text style={styles.sectionTitle}>Distance vs Pace</Text>
            </View>
            <Text style={styles.graphSubtitle}>
              Tap anywhere on the graph to see what song was playing at that distance
            </Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth - 80}
                height={300}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                segments={4}
                yAxisInterval={1}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={false}
                withHorizontalLabels={true}
                withDots={true}
                withShadow={false}
              />
              {/* Custom Y-axis labels overlay */}
              <View style={styles.yAxisLabelsOverlay} pointerEvents="none">
                {yAxisLabels.map((item, index) => {
                  const chartPaddingTop = 20
                  const chartPaddingBottom = 20
                  const chartHeight = 300 - chartPaddingTop - chartPaddingBottom
                  const yPosition = chartPaddingTop + ((1 - item.position) * chartHeight)
                  
                  return (
                    <Text
                      key={index}
                      style={[
                        styles.customYAxisLabel,
                        { top: yPosition - 6 }
                      ]}
                    >
                      {item.label}
                    </Text>
                  )
                })}
              </View>
              {/* Transparent overlay for tap detection */}
              <Pressable
                style={styles.chartOverlay}
                onPress={(event) => {
                  const { locationX } = event.nativeEvent
                  const chartWidth = screenWidth - 80
                  const paddingLeft = 60
                  const chartAreaWidth = chartWidth - paddingLeft - 20
                  const relativeX = locationX - paddingLeft
                  
                  if (relativeX >= 0 && relativeX <= chartAreaWidth && run.samples && run.samples.length > 0) {
                    const tappedDistance = (relativeX / chartAreaWidth) * totalDistance
                    const nearestSample = findNearestSample(tappedDistance)
                    if (nearestSample) {
                      setSelectedPoint(nearestSample)
                    }
                  }
                }}
              />
            </View>
            <View style={styles.axisLabelsContainer}>
              <Text style={styles.yAxisLabel}>Pace (min/mi)</Text>
              <Text style={styles.xAxisLabel}>Distance (miles)</Text>
            </View>

            {/* Selected Point Info */}
            {selectedPoint && (
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <MaterialIcons name="music-note" size={24} color="#5809C0" />
                  <Text style={styles.infoTitle}>
                    Song at {selectedPoint.distance.toFixed(2)} {selectedPoint.distance === 1 ? 'mile' : 'miles'}
                  </Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.songTitle}>{selectedPoint.song?.title || 'Unknown'}</Text>
                  <Text style={styles.songArtist}>{selectedPoint.song?.artist || 'Unknown'}</Text>
                  {selectedPoint.pace > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pace:</Text>
                      <Text style={styles.infoValue}>{secondsToPace(selectedPoint.pace)} min/mi</Text>
                    </View>
                  )}
                  {selectedPoint.song?.bpm > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>BPM:</Text>
                      <Text style={styles.infoValue}>{selectedPoint.song.bpm}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

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

