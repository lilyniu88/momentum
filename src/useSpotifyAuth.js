
// useSpotifyAuth.js
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID; 
const SCOPES = ['user-read-email', 'playlist-read-private'];

// Generate redirect URI based on platform
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    // For web with tunnel, use current origin (HTTPS)
    if (typeof window !== 'undefined' && window.location) {
      const origin = window.location.origin;
      const httpsOrigin = origin.startsWith('https://') 
        ? origin 
        : origin.replace(/^http:/, 'https:');
      return `${httpsOrigin}/auth/callback`;
    }
    return 'https://localhost:8081/auth/callback';
  }
  
  // For native (bare workflow), use custom scheme
  return AuthSession.makeRedirectUri({
    native: "momentum://redirect",
  });
};

export default function useSpotifyAuth() {
  const [token, setToken] = useState(null);

  const REDIRECT_URI = getRedirectUri();
  console.log('Redirect URI:', REDIRECT_URI);

  const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      responseType: 'token',
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      setToken(response.params.access_token);
    }
  }, [response]);

  return {
    token,
    promptAsync,
    redirectUri: REDIRECT_URI,
    isLoading: request === null,
  };
}
