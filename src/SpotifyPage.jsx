// SpotifyPage.js
import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import useSpotifyAuth from './useSpotifyAuth';
import styles from './SpotifyPage.styles'; // your styles file

export default function SpotifyPage() {
  const { token, promptAsync, redirectUri, isLoading } = useSpotifyAuth();

  if (token) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Spotify Music Library</Text>
        <Text style={styles.infoText}>
          Authenticated! Token: {token.substring(0, 20)}...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spotify Music Library</Text>

      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Connect to Spotify</Text>

        <View style={styles.redirectUriContainer}>
          <Text style={styles.redirectUriLabel}>
            Redirect URI:
          </Text>
          <Text style={styles.redirectUriText} selectable>
            {redirectUri}
          </Text>
        </View>

        <Pressable
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={() => promptAsync()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Sign in with Spotify</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
