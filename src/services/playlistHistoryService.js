import * as SecureStore from 'expo-secure-store';

const RECENTLY_SELECTED_KEY = 'recently_selected_playlists';
const MAX_RECENT_ITEMS = 3;

/**
 * Save a playlist type to recently selected
 * @param {string} playlistType - The playlist type ID (e.g., 'genre-pop', 'suggested')
 */
export const saveRecentlySelected = async (playlistType) => {
  try {
    const recent = await getRecentlySelected();
    
    // Remove if already exists (to move to front)
    const filtered = recent.filter(type => type !== playlistType);
    
    // Add to front
    const updated = [playlistType, ...filtered].slice(0, MAX_RECENT_ITEMS);
    
    await SecureStore.setItemAsync(RECENTLY_SELECTED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently selected playlist:', error);
  }
};

/**
 * Get recently selected playlist types
 * @returns {Promise<Array<string>>} - Array of playlist type IDs
 */
export const getRecentlySelected = async () => {
  try {
    const data = await SecureStore.getItemAsync(RECENTLY_SELECTED_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting recently selected playlists:', error);
    return [];
  }
};

/**
 * Clear recently selected playlists
 */
export const clearRecentlySelected = async () => {
  try {
    await SecureStore.deleteItemAsync(RECENTLY_SELECTED_KEY);
  } catch (error) {
    console.error('Error clearing recently selected playlists:', error);
  }
};

