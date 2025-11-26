import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

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
 * For Expo Go, we need to use the proxy which provides a stable URL
 */
let cachedRedirectUri = null;

const getRedirectUri = () => {
  // Cache the redirect URI so it's consistent across calls
  if (cachedRedirectUri) {
    return cachedRedirectUri;
  }
  
  // For Expo Go, useProxy: true gives us a stable proxy URL
  // For standalone builds, it will use the native scheme
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
    native: 'momentum://redirect',
  });
  
  cachedRedirectUri = redirectUri;
  return redirectUri;
};

/**
 * Create auth request configuration
 */
const useAuthRequest = () => {
  const redirectUri = getRedirectUri();
  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      responseType: AuthSession.ResponseType.Code,
      clientId: SPOTIFY_CLIENT_ID,
      scopes: [
        'user-top-read',              // Required for /me/top/tracks
        'user-read-private',          // Optional but useful
        'user-modify-playback-state',  // Required for controlling playback
        'user-read-playback-state',   // Required for reading playback state and devices
      ],
      usePKCE: true,
      redirectUri,
    },
    discovery
  );
  
  return [request, response, promptAsync];
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth response
 * @param {string} codeVerifier - PKCE code verifier
 * @param {string} redirectUri - The EXACT redirect URI used in the auth request (must match!)
 */
const exchangeCodeForTokens = async (code, codeVerifier, redirectUri) => {
  const uriToUse = redirectUri || getRedirectUri();
  
  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: uriToUse,
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
      // Only clear tokens if refresh token is invalid (400) or unauthorized (401)
      // Network errors or other issues shouldn't clear tokens - user can retry
      if (error.message.includes('400') || 
          error.message.includes('401') || 
          error.message.includes('invalid_grant') ||
          error.message.includes('invalid_request')) {
        console.error('Refresh token is invalid, clearing tokens');
        await clearTokens();
        return null;
      } else {
        return null;
      }
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

