# Momentum - Quick Run App

A modern React Native running app that generates personalized playlists based on distance and intensity preferences.

## Features

- **Quick Run** home page with distance and intensity filters
- **Playlist Generation** - Automatically generates a curated playlist based on your preferences
- **Material UI Icons** - Beautiful, consistent iconography throughout
- **Responsive Design** - Works on iOS, Android, and Web

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

#### Option 1: Web Development (Recommended for Development)

The easiest way to develop and test the app is on the web:

```bash
npm run web
```

Or:

```bash
npx expo start --web
```

This will:
1. Start the Metro bundler
2. Open the app in your default browser at `http://localhost:8081`
3. Enable hot reloading for fast development

**Note:** The app uses web-compatible dropdowns when running on web, so you can develop and test the UI without needing a mobile device or simulator.

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

#### Option 4: Expo Go (Mobile Device)

1. Start Expo:
```bash
npx expo start
```

2. Scan the QR code with:
   - **iOS:** Camera app or Expo Go app
   - **Android:** Expo Go app

## Project Structure

```
momentum/
├── src/
│   ├── QuickRun.jsx    # Main Quick Run component with filters
│   └── Playlist.jsx   # Playlist display component
├── index.js           # React Native entry point
├── app.json           # App configuration
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Development Tips

### Web Development

- The app automatically detects the platform and uses web-compatible components
- Material UI icons work seamlessly on web
- Hot reloading is enabled by default
- Open browser DevTools (F12) to see console logs and debug

### Fonts on Web

The app uses web fonts (Oswald and Figtree) when running on web. Make sure you have internet connection or the fonts are loaded in your HTML. The fonts will fall back to system fonts if not available.

## Scripts

- `npm start` - Start Metro bundler
- `npm run web` - Start Expo with web support
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Troubleshooting

### Web page is blank

1. Check the browser console (F12) for errors
2. Make sure Metro bundler is running
3. Try clearing cache: `npx expo start --web --clear`
4. Refresh the browser page

### Fonts not loading on web

The app uses web fonts. If fonts don't load:
1. Check your internet connection
2. Fonts will fall back to system fonts automatically
3. The app will still function correctly

### Picker not working on web

The app uses custom web-compatible dropdowns when running on web. If you see issues:
1. Make sure you're using the latest version
2. Check browser console for errors
3. Try a different browser

## License

MIT

