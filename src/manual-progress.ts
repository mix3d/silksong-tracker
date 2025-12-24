/**
 * Manual Progress Tracking
 * 
 * This module manages user's manual toggles for progress items.
 * All manual progress is stored in localStorage and persists between page loads.
 */

const STORAGE_KEY = "silksong-manual-progress";

interface ManualProgressData {
  [itemId: string]: unknown;
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
 * Get the manually set value for a specific item (returns undefined if not manually set)
 */
export function getManualValue(itemId: string): unknown {
  const progress = getManualProgress();
  return progress[itemId];
}

/**
 * Check if a specific item has been manually set
 */
export function isManuallySet(itemId: string): boolean {
  const progress = getManualProgress();
  return itemId in progress;
}

/**
 * Clear all items in a group except the specified item
 */
export function clearGroupExcept(group: string, keepItemId: string): void {
  const progress = getManualProgress();

  // Find and remove all items with the same group prefix
  // Items in a group typically have IDs like "red-silkshot-architect", "red-silkshot-forge", etc.
  const groupPattern = group.toLowerCase();
  let modified = false;

  for (const itemId of Object.keys(progress)) {
    if (itemId !== keepItemId && itemId.toLowerCase().includes(groupPattern)) {
      delete progress[itemId];
      modified = true;
    }
  }

  if (modified) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Error saving manual progress:", error);
    }
  }
}

/**
 * Toggle an item's manual completion state
 * Pass the value that represents "completed" for this item type
 * If the item belongs to a mutually exclusive group, clear other items in the group
 */
export function toggleManualProgress(
  itemId: string,
  completedValue: unknown = true,
  group?: string,
): void {
  const progress = getManualProgress();
  const isCurrentlySet = itemId in progress;

  if (isCurrentlySet) {
    // Remove from storage if already set (toggle off)
    delete progress[itemId];
  } else {
    // Set to the completed value (toggle on)
    progress[itemId] = completedValue;

    // If this item is part of a mutually exclusive group, clear others
    if (group && group.trim() !== "") {
      clearGroupExcept(group, itemId);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving manual progress:", error);
  }

  // Dispatch event so other parts of the app can react
  globalThis.dispatchEvent(
    new CustomEvent("manual-progress-changed", {
      detail: { itemId, value: isCurrentlySet ? undefined : completedValue },
    }),
  );
}

/**
 * Set an item's manual value explicitly
 */
export function setManualProgress(itemId: string, value: unknown): void {
  const progress = getManualProgress();

  if (value === undefined) {
    delete progress[itemId];
  } else {
    progress[itemId] = value;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving manual progress:", error);
  }

  globalThis.dispatchEvent(
    new CustomEvent("manual-progress-changed", {
      detail: { itemId, value },
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
