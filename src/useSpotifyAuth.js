
// useSpotifyAuth.js
import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';

const CLIENT_ID = "06f3fccea99a4ab9a04d837f4d6e5ce4"; 
const SCOPES = ['user-read-email', 'playlist-read-private'];

export default function useSpotifyAuth() {
  const [token, setToken] = useState(null);

  // Bare workflow: use a custom scheme for redirect
  const REDIRECT_URI = AuthSession.makeRedirectUri({
    native: "com.momentum.app://redirect", // must match the scheme in app.json
  });

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
