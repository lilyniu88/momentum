/**
 * Run Data Service
 * Manages saving and loading run history from JSON file
 * Uses expo-file-system legacy API
 */

import * as FileSystemLegacy from 'expo-file-system/legacy';

const RUNS_FILE_PATH = `${FileSystemLegacy.documentDirectory}runs.json`;

/**
 * Initialize runs file if it doesn't exist
 */
const initializeRunsFile = async () => {
  try {
    const fileInfo = await FileSystemLegacy.getInfoAsync(RUNS_FILE_PATH);
    
    if (!fileInfo.exists) {
      // Create empty file with initial structure
      const initialData = { runs: [] };
      const jsonString = JSON.stringify(initialData, null, 2);
      console.log('Creating initial runs file at:', RUNS_FILE_PATH);
      await FileSystemLegacy.writeAsStringAsync(RUNS_FILE_PATH, jsonString);
      console.log('Initial runs file created');
    }
  } catch (error) {
    console.error('Error initializing runs file:', error);
    console.error('Error details:', error.message);
    // Create empty file if initialization fails
    try {
      const initialData = { runs: [] };
      const jsonString = JSON.stringify(initialData, null, 2);
      await FileSystemLegacy.writeAsStringAsync(RUNS_FILE_PATH, jsonString);
      console.log('Created runs file after error');
    } catch (writeError) {
      console.error('Error creating runs file:', writeError);
      console.error('Write error details:', writeError.message);
    }
  }
};

/**
 * Load runs from JSON file
 * @returns {Promise<Array>} - Array of run objects
 */
export const loadRuns = async () => {
  try {
    await initializeRunsFile();
    const fileContent = await FileSystemLegacy.readAsStringAsync(RUNS_FILE_PATH);
    const data = JSON.parse(fileContent);
    return data.runs || [];
  } catch (error) {
    console.error('Error loading runs:', error);
    return [];
  }
};

/**
 * Save a new run to the JSON file
 * @param {Object} runData - Run data object
 * @returns {Promise<boolean>} - Success status
 */
export const saveRun = async (runData) => {
  try {
    console.log('Saving run data:', runData);
    await initializeRunsFile();
    const runs = await loadRuns();
    console.log('Loaded existing runs:', runs.length);
    
    // Add new run with timestamp
    const newRun = {
      id: Date.now().toString(), // Use timestamp as ID
      date: new Date().toISOString(),
      ...runData,
    };
    
    runs.unshift(newRun); // Add to beginning of array (most recent first)
    
    const data = { runs };
    const jsonString = JSON.stringify(data, null, 2);
    console.log('Writing to file:', RUNS_FILE_PATH);
    await FileSystemLegacy.writeAsStringAsync(RUNS_FILE_PATH, jsonString);
    console.log('Run saved successfully');
    
    return true;
  } catch (error) {
    console.error('Error saving run:', error);
    console.error('Error details:', error.message, error.stack);
    return false;
  }
};

/**
 * Get a specific run by ID
 * @param {string} runId - Run ID
 * @returns {Promise<Object|null>} - Run object or null
 */
export const getRunById = async (runId) => {
  try {
    const runs = await loadRuns();
    return runs.find(run => run.id === runId) || null;
  } catch (error) {
    console.error('Error getting run by ID:', error);
    return null;
  }
};

/**
 * Delete a run by ID
 * @param {string} runId - Run ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteRun = async (runId) => {
  try {
    await initializeRunsFile();
    const runs = await loadRuns();
    const filteredRuns = runs.filter(run => run.id !== runId);
    
    const data = { runs: filteredRuns };
    const jsonString = JSON.stringify(data, null, 2);
    await FileSystemLegacy.writeAsStringAsync(RUNS_FILE_PATH, jsonString);
    
    return true;
  } catch (error) {
    console.error('Error deleting run:', error);
    return false;
  }
};

export default {
  loadRuns,
  saveRun,
  getRunById,
  deleteRun,
};

