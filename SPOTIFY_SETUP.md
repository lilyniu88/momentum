# Spotify OAuth Setup Guide

This guide will help you set up Spotify OAuth integration for the Momentum app.

## Prerequisites

1. A Spotify account
2. Access to the Spotify Developer Dashboard

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an app"
4. Fill in:
   - **App name**: Momentum (or any name you prefer)
   - **App description**: Running playlist app
   - **Redirect URI**: We'll add this in the next step
5. Accept the terms and click "Save"

## Step 2: Get Your Client ID

1. In your app's dashboard, you'll see your **Client ID**
2. Copy this Client ID - you'll need it for the `.env` file
3. **Important**: Do NOT use the Client Secret in the app - PKCE handles security

## Step 3: Configure Redirect URIs

**IMPORTANT**: The redirect URI must match EXACTLY what the app sends. Check your console logs when you run the app to see the exact URI.

In your Spotify app settings, add these redirect URIs:

### For Development (Expo Go):
The redirect URI will be in the format:
```
https://auth.expo.dev/@diyasharma/momentum
```

**To find your exact redirect URI:**
1. Start your app: `npm run expo`
2. Navigate to the Playlist screen
3. Check the console/terminal - you'll see: `Spotify Redirect URI: https://auth.expo.dev/@diyasharma/momentum`
4. Copy this EXACT URI (including the full path)

### For Production:
- `momentum://redirect`

### For Web Development (optional):
- `http://localhost:19006`

**To add redirect URIs in Spotify Dashboard:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click "Edit Settings" (or the settings icon)
4. Scroll down to "Redirect URIs"
5. Click "Add" and paste the EXACT URI from your console
6. Click "Add" after entering each URI
7. **IMPORTANT**: Click "Save" at the bottom of the page
8. Wait a few seconds for changes to propagate

**Common mistakes:**
- ❌ Adding a trailing slash: `https://auth.expo.dev/@diyasharma/momentum/` (wrong)
- ✅ No trailing slash: `https://auth.expo.dev/@diyasharma/momentum` (correct)
- ❌ Wrong username or app slug
- ❌ Forgetting to click "Save"
- ❌ Not waiting for changes to propagate (can take 10-30 seconds)

## Step 4: Enable Required Scopes

In your Spotify app settings, ensure these scopes are enabled:
- `user-top-read` (required - to fetch top tracks)
- `user-read-private` (optional - for user profile info)

## Step 5: Set Up GetSong BPM API

The app uses GetSong BPM API to fetch accurate BPM data for songs. You need to register for a free API key.

1. Go to [GetSong BPM API](https://getsongbpm.com/api)
2. Fill in the registration form with a valid email address
3. You'll receive an API key via email
4. **Important**: You must add a backlink to getsongbpm.com in your app (as per their terms)

## Step 6: Set Up Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your Spotify Client ID and GetSong API key:

```env
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
GETSONG_API_KEY=your_getsong_api_key_here
```

**Important:**
- Use `EXPO_PUBLIC_` prefix for Spotify Client ID so Expo exposes it to the client
- GetSong API key can be `GETSONG_API_KEY` or `EXPO_PUBLIC_GETSONG_API_KEY`
- Do NOT include Spotify `CLIENT_SECRET` - PKCE handles security without it
- Never commit `.env` to version control (it should be in `.gitignore`)

## Step 7: Install Dependencies

Dependencies should already be installed, but if needed:

```bash
npx expo install expo-auth-session expo-linking expo-secure-store
```

## Step 8: Test the Integration

1. Start your Expo app:
   ```bash
   npm run expo
   ```

2. Navigate to the Playlist screen
3. You should see a "Connect Spotify" button
4. Click it to start the OAuth flow
5. After logging in, you should see your top tracks sorted by BPM

## Troubleshooting

### "SPOTIFY_CLIENT_ID not found" warning
- Make sure your `.env` file exists in the root directory
- Make sure the variable is named `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`
- Restart your Expo server after creating/updating `.env`

### "GetSong API key not configured" warning
- Make sure `GETSONG_API_KEY` is set in your `.env` file
- Register for a free API key at https://getsongbpm.com/api
- Restart your Expo server after adding the API key
- Note: The API has a rate limit of 3000 requests per hour

### "Invalid redirect URI" error
- Check that your redirect URI in Spotify Dashboard matches exactly what's returned by `makeRedirectUri`
- For Expo Go, use the proxy URI: `https://auth.expo.dev/@<username>/momentum`
- Make sure there are no trailing slashes or extra characters

### Authentication fails
- Check that your Client ID is correct
- Verify redirect URIs are added in Spotify Dashboard
- Check browser console for detailed error messages

### No tracks showing
- Make sure you have listening history on Spotify
- Top tracks are based on your recent listening (short_term = last 4 weeks)
- Try refreshing or re-authenticating

## Security Notes

- ✅ **PKCE (Proof Key for Code Exchange)** is used - no client secret needed
- ✅ Tokens are stored securely using `expo-secure-store`
- ✅ Tokens automatically refresh when expired
- ✅ All API requests include proper authentication headers

## Next Steps

Once authenticated, the app will:
1. Fetch your top 50 tracks from Spotify
2. Get BPM (tempo) for each track using GetSong BPM API (searches by song title and artist)
3. Sort tracks by BPM
4. Filter by distance/intensity preferences based on BPM ranges
5. Allow you to open tracks in Spotify app

**BPM Filtering:**
- **Low intensity**: 120-140 BPM
- **Medium intensity**: 140-160 BPM
- **High intensity**: 160+ BPM

Enjoy your personalized running playlists! 🎵🏃

