import { useState, useEffect } from 'react';
import { encode as btoa } from 'base-64';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export default function useSpotifyPublic() {
  const [token, setToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get access token using Client Credentials Flow
  const fetchToken = async () => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await response.json();
      setToken(data.access_token);
      console.log('Spotify token:', data.access_token);
    } catch (err) {
      console.log('Error fetching Spotify token:', err);
    }
  };

  // Fetch a public album (from Spotify's API)
  const fetchPublicPlaylist = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/albums/4aawyAB9vmqN3uQ7FjRGTy', 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', response.status, errorData);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Album data:', data);
      console.log('Tracks items:', data.tracks?.items);
      
      if (data.tracks && data.tracks.items) {
        setPlaylists(data.tracks.items);
      } else {
        console.log('Unexpected data structure:', data);
        setPlaylists([]);
      }
    } catch (err) {
      console.log('Error fetching playlist:', err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  useEffect(() => {
    if (token) fetchPublicPlaylist();
  }, [token]);

  return { token, playlists, loading };
}
