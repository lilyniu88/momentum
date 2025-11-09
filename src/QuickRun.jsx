import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
} from 'react-native'
import Playlist from './Playlist'

function QuickRun() {
  const [distance, setDistance] = useState('')
  const [intensity, setIntensity] = useState('')
  const [showPlaylist, setShowPlaylist] = useState(false)
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
      setShowPlaylist(true)
    }
  }

  const getSelectedLabel = (value, options) => {
    const option = options.find(opt => opt.value === value)
    return option ? option.label : options[0].label
  }

  if (showPlaylist) {
    return <Playlist distance={distance} intensity={intensity} />
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
          <Text style={styles.title}>Quick Run</Text>
          
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

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#5809C0',
    textAlign: 'center',
    marginBottom: 40,
  },
  filters: {
    marginBottom: 32,
  },
  filterGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5809C0',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#5809C0',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    color: '#5809C0',
    marginLeft: 8,
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#5809C0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    padding: 20,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalOptionSelected: {
    backgroundColor: '#D3C2F7',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#5809C0',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
  },
})

export default QuickRun
