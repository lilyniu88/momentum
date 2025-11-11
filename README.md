# Momentum - Quick Run App

A modern React Native running app that generates personalized playlists based on distance and intensity preferences, with real-time GPS tracking.

##To run the app:
npm install 
npx expo start

## To run the Spotify API: 
Go to the Spotify Developer Dashboard (https://developer.spotify.com/dashboard)
Log in and click “Create an App.”
Copy your Client ID and Client Secret
Create a .env file in your project root and add your Client ID and Client Secret.
Add redirect URIs (https://auth.expo.dev/yourusername/momentum, exp://xx.x.xx:xxxx) based on your Expo Go username and what shows up in terminal when you start the app

##To run the GetSongBPM API: 
Go to the Get Song BPM API dashboard (https://getsongbpm.com/api)
Create an API Key 
Add to the .env file 

AI Credit: We used Cursor and ChatGPT to help create starter files, implement Spotify API authentication, location tracking, and BPM filtering algorithm. 

## Credits

BPM data powered by [GetSong BPM](https://getsongbpm.com)

