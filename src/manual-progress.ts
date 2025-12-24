/**
 * Manual Progress Tracking
 * 
 * This module is now just a simple wrapper that updates the save data directly.
 * Manual checkbox selections modify the same save data structure that gets loaded from files.
 */

import type { Item } from "./types/Item.ts";
import { updateSaveDataValue } from "./save-data.ts";
import { clearManualSaveData } from "./save-data-updater.ts";

/**
 * Set an item's value in the save data
 * This is called when users manually check/uncheck items
 */
export function setManualProgress(item: Item, value: unknown): void {
  updateSaveDataValue(item, value);
}

/**
 * Clear all manual progress (delegates to save data system)
 */
export function clearManualProgress(): void {
  clearManualSaveData();
}
