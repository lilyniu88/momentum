import React, { useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import QuickRun from './QuickRun'
import Activity from './Activity'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [isRunActive, setIsRunActive] = useState(false)

  const handleRunStart = () => {
    setIsRunActive(true)
  }

  const handleRunStop = () => {
    setIsRunActive(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'home' && (
          <QuickRun 
            key="home" 
            onRunStart={handleRunStart}
            onRunStop={handleRunStop}
          />
        )}
        {activeTab === 'activity' && <Activity key="activity" />}
      </View>
      
      {/* Bottom Tab Navigation - Hide during run */}
      {!isRunActive && (
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'home' && styles.tabActive]}
            onPress={() => setActiveTab('home')}
          >
            <MaterialIcons
              name="home"
              size={24}
              color={activeTab === 'home' ? '#5809C0' : '#999999'}
            />
            <View style={styles.tabLabelContainer}>
              <View style={[styles.tabIndicator, activeTab === 'home' && styles.tabIndicatorActive]} />
            </View>
          </Pressable>
          
          <Pressable
            style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
            onPress={() => setActiveTab('activity')}
          >
            <FontAwesome5
              name="running"
              size={20}
              color={activeTab === 'activity' ? '#5809C0' : '#999999'}
              solid
            />
            <View style={styles.tabLabelContainer}>
              <View style={[styles.tabIndicator, activeTab === 'activity' && styles.tabIndicatorActive]} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    // Active state styling handled by icon color
  },
  tabLabelContainer: {
    marginTop: 4,
    height: 3,
    width: 40,
  },
  tabIndicator: {
    height: 3,
    width: 0,
    backgroundColor: '#5809C0',
    borderRadius: 2,
  },
  tabIndicatorActive: {
    width: 40,
  },
})

export default App

