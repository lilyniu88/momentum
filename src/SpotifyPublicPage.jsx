import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import useSpotifyPublic from './useSpotifyPublic';

export default function SpotifyPublicPage() {
    const { token, playlists, loading } = useSpotifyPublic();
  
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Album Tracks:
        </Text>
  
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Loading tracks...</Text>
          </View>
        ) : playlists && playlists.length > 0 ? (
          <View>
            {playlists.map((track, index) => {
              // Track objects are direct (not wrapped in track property)
              if (!track || !track.id) {
                return (
                  <View key={`track-${index}`} style={{ paddingVertical: 5 }}>
                    <Text style={{ color: 'gray' }}>Track {index + 1}: (No track data)</Text>
                  </View>
                );
              }
              return (
                <View key={track.id} style={{ paddingVertical: 8, paddingLeft: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    {track.name || 'Unknown Track'}
                  </Text>
                  {track.artists && track.artists.length > 0 && (
                    <Text style={{ color: 'gray', fontSize: 12, marginTop: 2 }}>
                      by {track.artists.map(a => a.name).join(', ')}
                    </Text>
                  )}
                  {track.duration_ms && (
                    <Text style={{ color: 'gray', fontSize: 11, marginTop: 2 }}>
                      {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ marginTop: 10, color: 'gray' }}>
            No tracks available. {token ? 'Try refreshing.' : 'Waiting for token...'}
          </Text>
        )}
      </ScrollView>
    );
  }
  