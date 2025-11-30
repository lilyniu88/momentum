import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { loadRuns } from './services/runDataService'
import RunDetail from './RunDetail'
import { activityStyles as styles } from './styles'

function Activity() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState(null)

  useEffect(() => {
    loadRunsData()
  }, [])

  const loadRunsData = async () => {
    try {
      setLoading(true)
      const loadedRuns = await loadRuns()
      setRuns(loadedRuns)
    } catch (error) {
      console.error('Error loading runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      }
      // Check if it's yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      }
      // Otherwise, format as date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (error) {
      return dateString
    }
  }

  const handleRunPress = (run) => {
    setSelectedRun(run)
  }

  const handleBackToList = () => {
    setSelectedRun(null)
    // Reload runs in case any were deleted
    loadRunsData()
  }

  if (selectedRun) {
    return <RunDetail run={selectedRun} onBack={handleBackToList} />
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Activity</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5809C0" />
          <Text style={styles.loadingText}>Loading runs...</Text>
        </View>
      </View>
    )
  }

  if (runs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Activity</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="directions-run" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>No runs yet</Text>
          <Text style={styles.emptySubtext}>Complete a run to see it here</Text>
        </View>
      </View>
    )
  }

  const formatTime = (timeString) => {
    // Time is already in HH:MM:SS format from RunningPage
    return timeString || '00:00:00'
  }

  const formatPace = (paceString) => {
    // Pace is already in M:SS format
    return paceString || '0:00'
  }

  const renderRunItem = ({ item: run }) => {
    // Calculate average pace if not available
    const averagePace = run.averagePace || (run.samples && run.samples.length > 0
      ? (() => {
          const validPaces = run.samples.filter(s => s.pace > 0).map(s => s.pace)
          if (validPaces.length === 0) return '0:00'
          const avgPaceSeconds = validPaces.reduce((sum, p) => sum + p, 0) / validPaces.length
          const mins = Math.floor(avgPaceSeconds / 60)
          const secs = Math.floor(avgPaceSeconds % 60)
          return `${mins}:${String(secs).padStart(2, '0')}`
        })()
      : '0:00')

    return (
      <Pressable
        style={styles.runItem}
        onPress={() => handleRunPress(run)}
      >
        <View style={styles.runItemContent}>
          <View style={styles.runItemLeft}>
            <MaterialIcons name="directions-run" size={24} color="#5809C0" />
            <View style={styles.runItemInfo}>
              {/* Date/Day */}
              <Text style={styles.runItemDate}>{formatDate(run.date)}</Text>
              
              {/* Stats in vertical layout */}
              <View style={styles.runItemStats}>
                {/* Total Distance */}
                <View style={styles.runItemStatRow}>
                  <Text style={styles.runItemStatLabel}>Distance:</Text>
                  <Text style={styles.runItemStatValue}>
                    {run.totalDistance ? `${parseFloat(run.totalDistance).toFixed(2)} mi` : '0.00 mi'}
                  </Text>
                </View>
                
                {/* Total Time */}
                <View style={styles.runItemStatRow}>
                  <Text style={styles.runItemStatLabel}>Time:</Text>
                  <Text style={styles.runItemStatValue}>{formatTime(run.totalTime)}</Text>
                </View>
                
                {/* Average Pace */}
                <View style={styles.runItemStatRow}>
                  <Text style={styles.runItemStatLabel}>Avg Pace:</Text>
                  <Text style={styles.runItemStatValue}>{formatPace(averagePace)} min/mi</Text>
                </View>
              </View>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#CCCCCC" />
        </View>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Activity</Text>
        </View>
      </View>
      <FlatList
        data={runs}
        renderItem={renderRunItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default Activity

