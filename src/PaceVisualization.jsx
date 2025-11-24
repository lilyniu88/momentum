import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'

const screenWidth = Dimensions.get('window').width

/**
 * Convert pace string (e.g., "6:30") to seconds per mile
 */
const paceToSeconds = (paceString) => {
  const [minutes, seconds] = paceString.split(':').map(Number)
  return minutes * 60 + seconds
}

/**
 * Convert seconds per mile to pace string
 */
const secondsToPace = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * Pace Visualization Component
 * Shows distance vs pace graph with tap-to-see-song functionality
 * Appears after ending a run
 */
function PaceVisualization({ onClose }) {
  // Mock workout data
  const mockWorkoutData = useMemo(() => {
    const songs = [
      { id: 1, title: '365', artist: 'Charli XCX', bpm: 128 },
      { id: 2, title: 'HUMBLE.', artist: 'Kendrick Lamar', bpm: 150 },
      { id: 3, title: 'Water', artist: 'Tyla', bpm: 120 },
      { id: 4, title: 'ME!', artist: 'Taylor Swift', bpm: 95 },
      { id: 5, title: '360', artist: 'Charli XCX', bpm: 130 },
    ]

    // Generate pace data points for each mile (6 miles total)
    // Each data point represents pace for that mile
    const dataPoints = []
    const totalMiles = 6

    // Map songs to miles (cycle through songs)
    for (let mile = 1; mile <= totalMiles; mile++) {
      const songIndex = (mile - 1) % songs.length
      const song = songs[songIndex]

      // Simulate pace variation based on song BPM
      // Higher BPM generally correlates with faster pace
      const basePace = 420 // 7:00 min/mile in seconds
      const bpmFactor = (song.bpm - 120) / 10 // Adjust pace based on BPM
      const paceVariation = Math.random() * 15 - 7.5 // Random variation ±7.5 seconds
      const paceSeconds = basePace - (bpmFactor * 3) + paceVariation

      dataPoints.push({
        distance: mile, // miles
        pace: paceSeconds, // seconds per mile
        songId: song.id,
        song: song,
      })
    }

    return { dataPoints, songs }
  }, [])

  const [selectedPoint, setSelectedPoint] = useState(null)

  // Prepare chart data and calculate Y-axis range
  const { chartData, yAxisLabels } = useMemo(() => {
    const labels = []
    const data = []

    mockWorkoutData.dataPoints.forEach((point) => {
      // X-axis labels show mile numbers
      labels.push(`${point.distance}`)
      data.push(point.pace)
    })

    // Calculate Y-axis range for custom labels
    const minPace = Math.min(...data)
    const maxPace = Math.max(...data)
    const range = maxPace - minPace
    const padding = range * 0.1 // 10% padding
    const yMin = Math.max(0, minPace - padding)
    const yMax = maxPace + padding
    const yRange = yMax - yMin

    // Generate formatted Y-axis labels (5 segments)
    const numSegments = 5
    const yAxisLabels = []
    for (let i = 0; i <= numSegments; i++) {
      const value = yMax - (yRange * i / numSegments)
      const mins = Math.floor(value / 60)
      const secs = Math.floor(value % 60)
      yAxisLabels.push({
        value: value,
        label: `${mins}:${String(secs).padStart(2, '0')}`,
        position: i / numSegments, // 0 to 1, where 0 is top
      })
    }

    return {
      chartData: {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(88, 9, 192, ${opacity})`, // Purple color
            strokeWidth: 2,
          },
        ],
      },
      yAxisLabels,
    }
  }, [mockWorkoutData])

  // Handle chart press
  const handleChartPress = (data) => {
    if (data && data.x !== undefined) {
      const index = Math.floor(data.x)
      if (index >= 0 && index < mockWorkoutData.dataPoints.length) {
        const point = mockWorkoutData.dataPoints[index]
        setSelectedPoint(point)
      }
    }
  }

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(88, 9, 192, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, 0)`, // Transparent to hide default Y-axis labels
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#5809C0',
    },
  }

  return (
    <View style={styles.container}>
      {/* Header with X button */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome5 name="chart-line" size={28} color="#000000" style={styles.titleIcon} solid />
          <Text style={styles.title}>Distance vs Pace</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={28} color="#000000" />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Tap on the graph to see what song was playing at each mile</Text>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={300}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            onDataPointClick={handleChartPress}
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
              // Calculate Y position to align with chart grid lines
              // Chart height is 300px, with padding at top (approx 20px) and bottom (approx 20px)
              // The chart's internal drawing area starts around 20px from top
              const chartPaddingTop = 20
              const chartPaddingBottom = 20
              const chartHeight = 300 - chartPaddingTop - chartPaddingBottom
              // Position from top: padding + (inverse position since 0 is top in our calculation but chart draws from bottom)
              const yPosition = chartPaddingTop + ((1 - item.position) * chartHeight)
              
              return (
                <Text
                  key={index}
                  style={[
                    styles.customYAxisLabel,
                    { top: yPosition - 6 } // -6 to center the text vertically on the grid line
                  ]}
                >
                  {item.label}
                </Text>
              )
            })}
          </View>
          {/* Transparent overlay for better tap detection */}
          <Pressable
            style={styles.chartOverlay}
            onPress={(event) => {
              const { locationX } = event.nativeEvent
              const chartWidth = screenWidth - 40
              const paddingLeft = 60 // Approximate left padding for y-axis
              const chartAreaWidth = chartWidth - paddingLeft - 20
              const relativeX = locationX - paddingLeft
              
              if (relativeX >= 0 && relativeX <= chartAreaWidth) {
                // Calculate which mile was tapped (6 data points total)
                const dataPointIndex = Math.round(
                  (relativeX / chartAreaWidth) * (mockWorkoutData.dataPoints.length - 1)
                )
                const clampedIndex = Math.max(0, Math.min(dataPointIndex, mockWorkoutData.dataPoints.length - 1))
                const point = mockWorkoutData.dataPoints[clampedIndex]
                setSelectedPoint(point)
              }
            }}
          />
        </View>

        {/* Axis labels */}
        <View style={styles.axisLabelsContainer}>
          <Text style={styles.yAxisLabel}>Pace (min/mi)</Text>
          <Text style={styles.xAxisLabel}>Distance (miles)</Text>
        </View>

        {/* Selected Point Info */}
        {selectedPoint && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="music-note" size={24} color="#5809C0" />
              <Text style={styles.infoTitle}>Song at Mile {selectedPoint.distance}</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.songTitle}>{selectedPoint.song.title}</Text>
              <Text style={styles.songArtist}>{selectedPoint.song.artist}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pace:</Text>
                <Text style={styles.infoValue}>{secondsToPace(selectedPoint.pace)} min/mi</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BPM:</Text>
                <Text style={styles.infoValue}>{selectedPoint.song.bpm}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Tap anywhere on the graph to see which song was playing at that mile
          </Text>
        </View>

        {/* Workout Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Workout Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Distance:</Text>
            <Text style={styles.summaryValue}>
              {mockWorkoutData.dataPoints.length} miles
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Songs Played:</Text>
            <Text style={styles.summaryValue}>
              {new Set(mockWorkoutData.dataPoints.map(p => p.songId)).size}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avg Pace:</Text>
            <Text style={styles.summaryValue}>
              {secondsToPace(
                mockWorkoutData.dataPoints.reduce((sum, p) => sum + p.pace, 0) /
                  mockWorkoutData.dataPoints.length
              )}{' '}
              min/mi
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 10,
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  yAxisLabelsOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 50,
    height: 300,
    justifyContent: 'flex-start',
  },
  customYAxisLabel: {
    position: 'absolute',
    left: 8,
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  axisLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  yAxisLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  xAxisLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  infoContent: {
    marginTop: 8,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  instructions: {
    backgroundColor: '#E8E0FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#5809C0',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
})

export default PaceVisualization

