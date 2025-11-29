
import { AppState, INITIAL_STATE } from '../types';

const STORAGE_KEY = 'willpower_flow_v1';

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved);
    
    // Merge with initial state to handle new fields in future updates
    return { ...INITIAL_STATE, ...parsed };
  } catch (e) {
    console.error("Failed to load state", e);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const importAndSaveData = (jsonString: string): { success: boolean; message?: string } => {
  try {
    const parsed = JSON.parse(jsonString);

    // Simple validation: check for critical keys or object type
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Invalid JSON format' };
    }

    // Merge imported data with INITIAL_STATE to ensure structure integrity
    // This allows importing older backups into newer versions of the app
    const newState = { ...INITIAL_STATE, ...parsed };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return { success: true };
  } catch (e) {
    console.error("Import failed", e);
    return { success: false, message: 'Failed to parse JSON file' };
  }
};
