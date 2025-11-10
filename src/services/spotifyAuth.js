import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get CLIENT_ID from environment
// Use EXPO_PUBLIC_ prefix for Expo to expose it to the client
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

if (!SPOTIFY_CLIENT_ID) {
  console.warn('SPOTIFY_CLIENT_ID not found. Please set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in your .env file');
}

// Discovery endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  revocationEndpoint: 'https://accounts.spotify.com/api/revoke',
};

// SecureStore keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

/**
 * Get redirect URI for OAuth
 */
const getRedirectUri = () => {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    native: 'momentum://redirect',
  });
  
  // Log the redirect URI for debugging
  console.log('Spotify Redirect URI:', redirectUri);
  console.log('Make sure this exact URI is added to your Spotify Dashboard!');
  
  return redirectUri;
};

/**
 * Create auth request configuration
 */
const useAuthRequest = () => {
  const redirectUri = getRedirectUri();
  
  return AuthSession.useAuthRequest(
    {
      responseType: AuthSession.ResponseType.Code,
      clientId: SPOTIFY_CLIENT_ID,
      scopes: ['user-top-read', 'user-read-private'],
      usePKCE: true,
      redirectUri,
    },
    discovery
  );
};

/**
 * Exchange authorization code for tokens
 */
const exchangeCodeForTokens = async (code, codeVerifier) => {
  const redirectUri = getRedirectUri();
  
  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Spotify may not return refresh token
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Save tokens to SecureStore
 */
const saveTokens = async (accessToken, refreshToken, expiresIn) => {
  try {
    const expiryTime = Date.now() + (expiresIn * 1000);
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

/**
 * Get tokens from SecureStore
 */
const getStoredTokens = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const expiryTime = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    
    if (!accessToken || !refreshToken || !expiryTime) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiryTime: parseInt(expiryTime, 10),
    };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return null;
  }
};

/**
 * Clear stored tokens
 */
const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

/**
 * Get valid access token, refreshing if necessary
 */
const getValidAccessToken = async () => {
  const stored = await getStoredTokens();
  
  if (!stored) {
    return null;
  }
  
  const { accessToken, refreshToken, expiryTime } = stored;
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes
  
  if (now >= expiryTime - buffer) {
    // Token expired or about to expire, refresh it
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      await saveTokens(
        newTokens.accessToken,
        newTokens.refreshToken,
        newTokens.expiresIn
      );
      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear invalid tokens
      await clearTokens();
      return null;
    }
  }
  
  return accessToken;
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = async () => {
  const token = await getValidAccessToken();
  return token !== null;
};

export {
  useAuthRequest,
  exchangeCodeForTokens,
  refreshAccessToken,
  saveTokens,
  getStoredTokens,
  clearTokens,
  getValidAccessToken,
  isAuthenticated,
  getRedirectUri,
};

