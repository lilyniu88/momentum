# Momentum - Quick Run App

A modern React Native running app that generates personalized playlists based on distance and intensity preferences, with real-time GPS tracking.

## Features

- **Quick Run** home page with distance and intensity filters
- **Playlist Generation** - Automatically generates a curated playlist based on your preferences
- **Real-time Running Tracking** - GPS-based distance and pace calculation
- **Live Map View** - See your location and route in real-time
- **Material UI Icons** - Beautiful, consistent iconography throughout
- **Mobile-First Design** - Optimized for iOS and Android (Expo Go compatible)

## Design System

### Colors
- **Dominant Color:** `#FFFFFF` (white) - Backgrounds
- **Secondary Color:** `#5809C0` (dark purple) - Primary buttons, active states
- **Accent Color 1:** `#D3C2F7` (light purple) - Highlights
- **Accent Color 2:** `#EFEFEF` (gray) - Borders, separators
- **Accent Color 3:** `#7BF0FF` (bright blue) - Accents

### Typography
- **Oswald Font:**
  - Size 24: Album names
  - Size 32: During-run and some post-run stats
  - Size 48: Post-run main stats
- **Figtree Font:**
  - Size 24: Headers and categories
  - Size 14: All secondary text

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- For iOS: Xcode (macOS only)
- For Android: Android Studio

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App

#### Option 1: Expo Go (Recommended - Mobile Device)

1. Start Expo:
```bash
npx expo start
```

2. Scan the QR code with:
   - **iOS:** Camera app or Expo Go app
   - **Android:** Expo Go app

**Note:** The app uses GPS for location tracking, so you'll need to grant location permissions when prompted.

#### Option 2: iOS Simulator (macOS only)

1. Install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

2. Start Metro bundler:
```bash
npm start
```

3. Run on iOS Simulator:
```bash
npm run ios
```

#### Option 3: Android Emulator

1. Start Metro bundler:
```bash
npm start
```

2. Run on Android emulator:
```bash
npm run android
```

## Project Structure

```
momentum/
├── src/
│   ├── QuickRun.jsx       # Main Quick Run component with filters
│   ├── Playlist.jsx      # Playlist display component
│   ├── RunningPage.jsx   # Real-time running tracking with GPS
│   ├── services/
│   │   ├── playlistService.js  # Playlist filtering logic
│   │   └── healthService.js    # Pace and distance calculations
│   └── styles.js         # Universal styles
├── index.js                # React Native entry point
├── app.json               # App configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Development Tips

### Location Tracking

- The app uses GPS for real-time distance and pace calculation
- Location permissions are required for the running features
- Distance is calculated using the Haversine formula between GPS coordinates
- GPS noise is filtered out (movements < 3 meters are ignored)

## Scripts

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Troubleshooting

### Location not working

1. Make sure you've granted location permissions when prompted
2. Check that location services are enabled on your device
3. For best results, use the app outdoors with clear sky view

### Pace showing incorrect values

- Pace is calculated from GPS distance and elapsed time
- Make sure you're moving (GPS noise when stationary is filtered out)
- The app requires actual movement to calculate accurate pace

## License

MIT

