/**
 * Checkbox utility functions
 */

import type { Item } from "../types/Item.ts";
import { setManualProgress } from "../manual-progress.ts";
import { getSaveData, getSaveDataValue, getSaveDataFlags } from "../save-data.ts";

/**
 * Determine the "completed" value for an item based on its type
 */
export function getCompletedValueForItem(item: Item): unknown {
  switch (item.type) {
    case "level":
      return item.required;
    case "collectable":
      return 1;
    case "journal":
      return item.required;
    case "quest":
      return "completed";
    case "relic":
    case "materium":
    case "device":
      return "deposited";
    case "quill": {
      // Extract the quill number from the ID (QuillState_1 -> 1)
      const match = item.id.match(/QuillState_(\d+)/);
      return match ? Number.parseInt(match[1], 10) : 1;
    }
    default:
      return true;
  }
}

/**
 * Get the "uncompleted" value for an item (what to set when unchecking)
 */
function getUncompletedValueForItem(item: Item): unknown {
  switch (item.type) {
    case "level":
    case "collectable":
    case "journal":
    case "flagInt":
    case "quill":
      return 0;
    case "quest":
    case "relic":
    case "materium":
    case "device":
      return false;
    default:
      return false;
  }
}

/**
 * Check if an item is currently completed based on save data
 */
function isItemCompleted(item: Item): boolean {
  const saveData = getSaveData();
  const saveDataFlags = getSaveDataFlags();
  if (!saveData || !saveDataFlags) {
    return false;
  }

  const value = getSaveDataValue(saveData, saveDataFlags, item);
  return getUnlocked(item, value);
}

function getUnlocked(item: Item, value: unknown): boolean {
  if (item.type === "quest") {
    return value === "completed" || value === true;
  }

  if (item.type === "level") {
    const numberValue = typeof value === "number" ? value : 0;
    return numberValue >= item.required;
  }

  if (item.type === "collectable") {
    const numberValue = typeof value === "number" ? value : 0;
    return numberValue > 0;
  }

  if (item.type === "journal") {
    const numberValue = typeof value === "number" ? value : 0;
    return numberValue >= item.required || value === true;
  }

  if (item.type === "quill" && typeof value === "number") {
    return item.id === `QuillState_${value}` && [1, 2, 3].includes(value);
  }

  if (item.type === "key") {
    return value === true;
  }

  // For materium, relic, device, and other types
  return value === true || value === "collected" || value === "deposited";
}

/**
 * Create a reusable checkbox element
 */
export function createCheckbox(
  item: Item,
  isCompleted: boolean,
  onClick?: (e: Event) => void,
  getGroupItems?: (group: string) => Item[],
  getUpgradeRelated?: (item: Item) => Item[],
): HTMLInputElement {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isCompleted;
  checkbox.className = "item-checkbox";
  checkbox.setAttribute(
    "aria-label",
    isCompleted ? "Mark as incomplete" : "Mark as complete",
  );

  checkbox.addEventListener("click", (e) => {
    e.stopPropagation();

    // Check current state from save data
    const currentlyCompleted = isItemCompleted(item);
    const completedValue = getCompletedValueForItem(item);
    const uncompletedValue = getUncompletedValueForItem(item);

    if (currentlyCompleted) {
      // Toggle off - set to uncompleted value
      setManualProgress(item, uncompletedValue);

      // If this was an upgrade, also uncheck the base item
      if (item.upgradeOf && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          if (relatedItem.id === item.upgradeOf) {
            setManualProgress(relatedItem, getUncompletedValueForItem(relatedItem));
          }
        }
      }
    } else {
      // Toggle on - set to completed value
      setManualProgress(item, completedValue);

      // If this is an upgrade, also check the base item
      if (item.upgradeOf && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          if (relatedItem.id === item.upgradeOf) {
            const baseCompletedValue = getCompletedValueForItem(relatedItem);
            setManualProgress(relatedItem, baseCompletedValue);
          }
        }
      }

      // If this is a mutually exclusive item, clear others in the group
      // EXCEPT for quills, which all share the same flag and setting one automatically "clears" others
      if (item.unobtainable && item.group && getGroupItems && item.type !== "quill") {
        const groupItems = getGroupItems(item.group);
        for (const groupItem of groupItems) {
          if (groupItem.id !== item.id) {
            setManualProgress(groupItem, getUncompletedValueForItem(groupItem));
          }
        }
      }

      // If this is a base item with upgrades, clear all upgrades
      if (!item.upgradeOf && item.type === "tool" && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          if (relatedItem.id !== item.id && relatedItem.upgradeOf === item.id) {
            setManualProgress(relatedItem, getUncompletedValueForItem(relatedItem));
          }
        }
      }
    }

    if (onClick) {
      onClick(e);
    }
  });

  return checkbox;
}
