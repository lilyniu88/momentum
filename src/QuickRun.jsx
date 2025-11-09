import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { MaterialIcons } from '@expo/vector-icons'
import Playlist from './Playlist'

function QuickRun() {
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState('')
  const [showPlaylist, setShowPlaylist] = useState(false)

  useEffect(() => {
    console.log('QuickRun component mounted, Platform:', Platform.OS)
    console.log('App should be visible now')
  }, [])

  const handleStart = () => {
    if (distance && intensity) {
      setShowPlaylist(true)
    }
  }

  if (showPlaylist) {
    return <Playlist distance={distance} intensity={intensity} />
  }

  console.log('QuickRun rendering, Platform:', Platform.OS)

  // Simple test to ensure component renders
  if (Platform.OS === 'web') {
    console.log('Web platform detected')
  }

  return (
    <View style={styles.app} testID="quick-run-app">
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.container}>
          <Text style={styles.title} testID="quick-run-title">
            Quick Run
          </Text>
          
          <View style={styles.filters}>
            <View style={styles.filterGroup}>
              <Text style={styles.label}>Distance</Text>
              <View style={styles.pickerContainer}>
                {Platform.OS === 'web' ? (
                  <WebPicker
                    selectedValue={distance}
                    onValueChange={setDistance}
                    options={[
                      { label: 'Select Distance', value: '' },
                      { label: 'Short', value: 'short' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'Long', value: 'long' },
                    ]}
                  />
                ) : (
                  <Picker
                    selectedValue={distance}
                    onValueChange={setDistance}
                    style={styles.picker}
                    dropdownIconColor="#5809C0"
                  >
                    <Picker.Item label="Select Distance" value="" />
                    <Picker.Item label="Short" value="short" />
                    <Picker.Item label="Medium" value="medium" />
                    <Picker.Item label="Long" value="long" />
                  </Picker>
                )}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.label}>Intensity</Text>
              <View style={styles.pickerContainer}>
                {Platform.OS === 'web' ? (
                  <WebPicker
                    selectedValue={intensity}
                    onValueChange={setIntensity}
                    options={[
                      { label: 'Select Intensity', value: '' },
                      { label: 'Low', value: 'low' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'High', value: 'high' },
                    ]}
                  />
                ) : (
                  <Picker
                    selectedValue={intensity}
                    onValueChange={setIntensity}
                    style={styles.picker}
                    dropdownIconColor="#5809C0"
                  >
                    <Picker.Item label="Select Intensity" value="" />
                    <Picker.Item label="Low" value="low" />
                    <Picker.Item label="Medium" value="medium" />
                    <Picker.Item label="High" value="high" />
                  </Picker>
                )}
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
            <Text style={styles.startButtonText}>Start</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

// Web-compatible picker component
function WebPicker({ selectedValue, onValueChange, options }) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(opt => opt.value === selectedValue) || options[0]

  return (
    <View style={styles.webPickerWrapper}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={styles.webPickerButton}
      >
        <Text style={styles.webPickerText}>
          {selectedOption.label}
        </Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color="#5809C0" 
        />
      </Pressable>
      {isOpen && (
        <View style={styles.webPickerDropdown}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onValueChange(option.value)
                setIsOpen(false)
              }}
              style={[
                styles.webPickerOption,
                selectedValue === option.value && styles.webPickerOptionSelected
              ]}
            >
              <Text style={[
                styles.webPickerOptionText,
                selectedValue === option.value && styles.webPickerOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { 
      minHeight: '100vh',
      display: 'flex',
    }),
  },
  scrollView: {
    flex: 1,
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
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
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
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
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
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  // Web picker styles
  webPickerWrapper: {
    position: 'relative',
    width: '100%',
  },
  webPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  webPickerText: {
    fontSize: 16,
    color: '#5809C0',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  webPickerDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderTopWidth: 0,
    borderRadius: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: 1000,
    shadowColor: '#5809C0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  webPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  webPickerOptionSelected: {
    backgroundColor: '#D3C2F7',
  },
  webPickerOptionText: {
    fontSize: 16,
    color: '#5809C0',
    fontFamily: Platform.OS === 'web' ? 'Figtree, sans-serif' : undefined,
  },
  webPickerOptionTextSelected: {
    fontWeight: '600',
  },
})

export default QuickRun

