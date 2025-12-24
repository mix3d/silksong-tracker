/**
 * Manual Progress Tracking
 * 
 * This module manages user's manual toggles for progress items.
 * All manual progress is stored in localStorage and persists between page loads.
 */

const STORAGE_KEY = "silksong-manual-progress";

interface ManualProgressData {
  [itemId: string]: boolean;
}

/**
 * Load all manual progress toggles from localStorage
 */
export function getManualProgress(): ManualProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return {};
    }
    return JSON.parse(stored) as ManualProgressData;
  } catch (error) {
    console.error("Error loading manual progress:", error);
    return {};
  }
}

/**
 * Check if a specific item is manually toggled as completed
 */
export function isManuallyCompleted(itemId: string): boolean {
  const progress = getManualProgress();
  return progress[itemId] === true;
}

/**
 * Toggle an item's manual completion state
 * Returns the new state (true = completed, false = not completed)
 */
export function toggleManualProgress(itemId: string): boolean {
  const progress = getManualProgress();
  const currentState = progress[itemId] === true;
  const newState = !currentState;

  if (newState) {
    progress[itemId] = true;
  } else {
    // Remove from storage if unchecked to keep storage clean
    delete progress[itemId];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving manual progress:", error);
  }

  // Dispatch event so other parts of the app can react
  globalThis.dispatchEvent(
    new CustomEvent("manual-progress-changed", {
      detail: { itemId, completed: newState },
    }),
  );

  return newState;
}

/**
 * Set an item's manual completion state explicitly
 */
export function setManualProgress(itemId: string, completed: boolean): void {
  const progress = getManualProgress();

  if (completed) {
    progress[itemId] = true;
  } else {
    delete progress[itemId];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving manual progress:", error);
  }

  globalThis.dispatchEvent(
    new CustomEvent("manual-progress-changed", {
      detail: { itemId, completed },
    }),
  );
}

/**
 * Clear all manual progress
 */
export function clearManualProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    globalThis.dispatchEvent(new Event("manual-progress-changed"));
  } catch (error) {
    console.error("Error clearing manual progress:", error);
  }
}

/**
 * Export all manual progress data (for debugging/backup)
 */
export function exportManualProgress(): string {
  return JSON.stringify(getManualProgress(), null, 2);
}

/**
 * Import manual progress data (for restore)
 */
export function importManualProgress(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData) as ManualProgressData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    globalThis.dispatchEvent(new Event("manual-progress-changed"));
  } catch (error) {
    console.error("Error importing manual progress:", error);
    throw error;
  }
}
