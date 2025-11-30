import React, { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import PlaylistSelection from './PlaylistSelection'
import { quickRunStyles as styles } from './styles'

function QuickRun({ onRunStart, onRunStop }) {
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState('')
  const [showPlaylistSelection, setShowPlaylistSelection] = useState(false)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [showIntensityModal, setShowIntensityModal] = useState(false)

  const distanceOptions = [
    { label: 'Select Distance', value: '' },
    { label: 'Short', value: 'short' },
    { label: 'Medium', value: 'medium' },
    { label: 'Long', value: 'long' },
  ]

  const intensityOptions = [
    { label: 'Select Intensity', value: '' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ]

  const handleStart = () => {
    if (distance && intensity) {
      setShowPlaylistSelection(true)
    }
  }

  const getSelectedLabel = (value, options) => {
    const option = options.find(opt => opt.value === value)
    return option ? option.label : options[0].label
  }

  const handleBackToSelection = () => {
    setShowPlaylistSelection(false)
    // Reset filters when coming back
    setDistance('')
    setIntensity('')
    // Notify App that run has stopped
    if (onRunStop) {
      onRunStop()
    }
  }

  if (showPlaylistSelection) {
    return (
      <PlaylistSelection 
        distance={distance} 
        intensity={intensity} 
        onBack={handleBackToSelection}
        onRunStart={onRunStart}
        onRunStop={onRunStop}
      />
    )
  }

  const renderPickerModal = (options, selectedValue, onSelect, isVisible, onClose) => (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value)
                  onClose()
                }}
                style={[
                  styles.modalOption,
                  selectedValue === option.value && styles.modalOptionSelected
                ]}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedValue === option.value && styles.modalOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )

  return (
    <View style={styles.app}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Quick Run</Text>
          </View>
          
          <View style={styles.filters}>
            <View style={styles.filterGroup}>
              <Text style={styles.label}>Distance</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setShowDistanceModal(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {getSelectedLabel(distance, distanceOptions)}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </Pressable>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.label}>Intensity</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setShowIntensityModal(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {getSelectedLabel(intensity, intensityOptions)}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </Pressable>
            </View>
          </View>

          <Pressable 
            onPress={handleStart}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </Pressable>
        </View>
      </ScrollView>

      {renderPickerModal(
        distanceOptions,
        distance,
        setDistance,
        showDistanceModal,
        () => setShowDistanceModal(false)
      )}

      {renderPickerModal(
        intensityOptions,
        intensity,
        setIntensity,
        showIntensityModal,
        () => setShowIntensityModal(false)
      )}
    </View>
  )
}

export default QuickRun
