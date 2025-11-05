# Momentum - Quick Run

A modern React Native running app with filter options for distance and intensity.

## Features

- **Quick Run** home page
- Filter by distance (Short, Medium, Long)
- Filter by intensity (Short, Medium, High)
- Generated playlist page with track details
- Start button to begin your run

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- React Native development environment set up
  - For iOS: Xcode (macOS only)
  - For Android: Android Studio

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App

1. For iOS, install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

2. Start the Metro bundler:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

### Project Structure

- `src/QuickRun.jsx` - Main Quick Run component with filters
- `src/Playlist.jsx` - Playlist display component
- `index.js` - React Native entry point

## Development

The app uses React Native with the following key dependencies:
- `react-native` - Core React Native framework
- `@react-native-picker/picker` - Dropdown picker component

## Style Guide

- Dominant Color: #FFFFFF (white)
- Secondary Color: #5809C0 (dark purple)
- Accent Color 1: #D3C2F7 (light purple)
- Accent Color 2: #EFEFEF (gray)
- Accent Color 3: #7BF0FF (bright blue)
- Corner radius: 20px