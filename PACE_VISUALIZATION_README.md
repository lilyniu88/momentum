# Pace Visualization Screen

A standalone data visualization screen that displays a "Pace vs Time" graph with tap-to-see-song functionality.

## Features

- **Interactive Line Chart**: Shows pace (min/mi) over time during a workout
- **Tap to See Song**: Tap anywhere on the graph to see which song was playing at that time
- **Song Information**: Displays song title, artist, BPM, and pace at the selected time point
- **Workout Summary**: Shows total duration, songs played, and average pace

## Running the Standalone Component

To run this visualization screen independently:

1. **Update index.js** to use the PaceVisualization entry point:
   ```javascript
   // In index.js, change:
   import { registerRootComponent } from 'expo';
   import PaceVisualization from './src/PaceVisualization';
   
   registerRootComponent(PaceVisualization);
   ```

2. **Or use the dedicated entry point**:
   ```bash
   # You can temporarily rename index.js and use PaceVisualizationEntry.jsx
   # Or modify index.js to import PaceVisualization instead of QuickRun
   ```

3. **Start the app**:
   ```bash
   npm start
   # or
   expo start
   ```

## Current Implementation

The component currently uses **mock data** for demonstration purposes. In a production app, you would:

1. Store workout data (pace, time, current song) during the run
2. Load historical workout data from storage
3. Map time points to songs that were playing

## Mock Data Structure

The mock data includes:
- 5 sample songs with different BPMs
- 20 minutes of workout data (1200 seconds)
- Data points every 10 seconds
- Pace variations based on song BPM

## Customization

To use real workout data, modify the `mockWorkoutData` in `PaceVisualization.jsx` to:
- Load from AsyncStorage or a database
- Use actual workout history
- Map songs to time points based on when they were played

## Dependencies

- `react-native-chart-kit` - For the line chart visualization
- `react-native-svg` - Required by react-native-chart-kit
- `@expo/vector-icons` - For icons

All dependencies are already installed in the project.

