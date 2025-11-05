# How to Open and Run the App

## Option 1: Using Expo (Easiest - Recommended)

Expo allows you to test React Native apps on your phone without setting up Xcode or Android Studio.

1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Expo:**
   ```bash
   npx expo start
   ```

4. **On your phone:**
   - Install the "Expo Go" app from the App Store (iOS) or Play Store (Android)
   - Scan the QR code that appears in the terminal
   - The app will open on your phone

## Option 2: React Native CLI (Full Native Setup)

You'll need to initialize the iOS and Android native projects first.

### For iOS (macOS only):

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install CocoaPods (if not already installed):**
   ```bash
   sudo gem install cocoapods
   ```

3. **Initialize iOS project:**
   ```bash
   npx react-native init TempProject --version 0.73.0
   # Copy the ios folder from TempProject to your project
   # Then delete TempProject
   ```

4. **Install iOS dependencies:**
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Start Metro bundler:**
   ```bash
   npm start
   ```

6. **Run on iOS Simulator:**
   ```bash
   npm run ios
   ```

### For Android:

1. **Install Android Studio** and set up an Android emulator

2. **Start Metro bundler:**
   ```bash
   npm start
   ```

3. **Run on Android emulator:**
   ```bash
   npm run android
   ```

## Quick Start (Recommended)

If you want to test quickly, use **Expo** (Option 1). It's the fastest way to see your app running!

```bash
npm install
npx expo start
```

Then scan the QR code with the Expo Go app on your phone.

