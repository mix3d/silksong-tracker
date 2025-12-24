/**
 * Manual Progress Tracking
 *
 * This module is now just a simple wrapper that updates the save data directly.
 * Manual checkbox selections modify the same save data structure that gets loaded from files.
 */

import type { Item } from "./types/Item.ts";
import { updateSaveDataValue } from "./save-data.ts";

/**
 * Set an item's value in the save data
 * This is called when users manually check/uncheck items
 */
export function setManualProgress(item: Item, value: unknown): void {
  updateSaveDataValue(item, value);
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
