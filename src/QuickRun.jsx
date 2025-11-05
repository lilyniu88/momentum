import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import Playlist from './Playlist'

function QuickRun() {
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState('')
  const [showPlaylist, setShowPlaylist] = useState(false)
  const fadeAnim = useState(new Animated.Value(0))[0]

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleStart = () => {
    // Show playlist page when long distance and high intensity are selected
    if (distance === 'long' && intensity === 'high') {
      setShowPlaylist(true)
    } else {
      // Handle other cases
      console.log('Starting run with filters:', { distance, intensity })
    }
  }

  if (showPlaylist) {
    return <Playlist />
  }

  return (
    <ScrollView style={styles.app} contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Quick Run</Text>
        
        <View style={styles.filters}>
          <View style={styles.filterGroup}>
            <Text style={styles.label}>Distance</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={distance}
                onValueChange={(itemValue) => setDistance(itemValue)}
                style={styles.picker}
                dropdownIconColor="#5809C0"
              >
                <Picker.Item label="Select Distance" value="" />
                <Picker.Item label="Short" value="short" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="Long" value="long" />
              </Picker>
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.label}>Intensity</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={intensity}
                onValueChange={(itemValue) => setIntensity(itemValue)}
                style={styles.picker}
                dropdownIconColor="#5809C0"
              >
                <Picker.Item label="Select Intensity" value="" />
                <Picker.Item label="Short" value="short" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>
          </View>
        </View>

        <Pressable 
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
        >
          {({ pressed }) => (
            <Text style={[styles.startButtonText, pressed && styles.startButtonTextPressed]}>
              Start
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#5809C0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#5809C0',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  filters: {
    flexDirection: 'column',
    gap: 24,
    marginBottom: 32,
  },
  filterGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
    color: '#5809C0',
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#5809C0',
    borderRadius: 20,
    shadowColor: '#5809C0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 7.5,
    elevation: 8,
  },
  startButtonPressed: {
    backgroundColor: '#7BF0FF',
    transform: [{ translateY: -2 }],
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  startButtonTextPressed: {
    color: '#5809C0',
  },
})

export default QuickRun
