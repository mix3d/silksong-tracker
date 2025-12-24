/**
 * Manual Progress Tracking
 *
 * This module manages user's manual toggles for progress items.
 * Now integrates directly with the save data system instead of separate storage.
 *
 * NOTE: Old localStorage-based system kept for backward compatibility during migration.
 */

import type { Item } from "./types/Item.ts";
import { updateSaveDataValue } from "./save-data.ts";

const STORAGE_KEY = "silksong-manual-progress";

interface ManualProgressData {
  [itemId: string]: unknown;
}

/**
 * Load all manual progress toggles from localStorage (legacy)
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
 * Get the manually set value for a specific item (legacy - now use save data directly)
 */
export function getManualValue(itemId: string): unknown {
  const progress = getManualProgress();
  return progress[itemId];
}

/**
 * Check if a specific item has been manually set (legacy)
 */
export function isManuallySet(itemId: string): boolean {
  const progress = getManualProgress();
  return itemId in progress;
}

/**
 * Toggle an item's manual completion state (legacy wrapper)
 */
export function toggleManualProgress(itemId: string, completedValue: unknown = true): void {
  // This is now a legacy function - not used in new system
  const progress = getManualProgress();
  const isCurrentlySet = itemId in progress;

  if (isCurrentlySet) {
    delete progress[itemId];
  } else {
    progress[itemId] = completedValue;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving manual progress:", error);
  }

  globalThis.dispatchEvent(
    new CustomEvent("manual-progress-changed", {
      detail: { itemId, value: isCurrentlySet ? undefined : completedValue },
    }),
  );
}

/**
 * Set an item's value in the save data (NEW SYSTEM)
 */
export function setManualProgress(item: Item, value: unknown): void {
  // Update the actual save data structure
  updateSaveDataValue(item, value);
}

/**
 * Set an item's value by ID (legacy signature - requires item lookup)
 * @deprecated Use setManualProgress(item, value) with Item object instead
 */
export function setManualProgressById(itemId: string, value: unknown): void {
  // Legacy function - dispatch event for backward compatibility
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
