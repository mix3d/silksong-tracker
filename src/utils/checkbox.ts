/**
 * Checkbox utility functions
 */

import type { Item } from "../types/Item.ts";
import { setManualProgress, getManualProgress } from "../manual-progress.ts";

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
    default:
      return true;
  }
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

    const progress = getManualProgress();
    const isCurrentlySet = item.id in progress;
    const completedValue = getCompletedValueForItem(item);

    if (isCurrentlySet) {
      // Toggle off - remove this item
      setManualProgress(item.id, undefined);

      // If this was an upgrade, also uncheck the base item
      if (item.upgradeOf && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          // Find the base item (not other upgrades)
          if (relatedItem.id === item.upgradeOf) {
            setManualProgress(relatedItem.id, undefined);
          }
        }
      }
    } else {
      // Toggle on - set this item
      setManualProgress(item.id, completedValue);

      // If this is an upgrade, also check the base item
      if (item.upgradeOf && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          // Check the base item
          if (relatedItem.id === item.upgradeOf) {
            const baseCompletedValue = getCompletedValueForItem(relatedItem);
            setManualProgress(relatedItem.id, baseCompletedValue);
          }
        }
      }

      // If this is a mutually exclusive item, clear others in the group
      if (item.unobtainable && item.group && getGroupItems) {
        const groupItems = getGroupItems(item.group);
        for (const groupItem of groupItems) {
          if (groupItem.id !== item.id) {
            setManualProgress(groupItem.id, undefined);
          }
        }
      }

      // If this is a base item with upgrades, clear all upgrades
      // (when you check the base, you shouldn't have the upgrade)
      if (!item.upgradeOf && item.type === "tool" && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          if (relatedItem.id !== item.id && relatedItem.upgradeOf === item.id) {
            setManualProgress(relatedItem.id, undefined);
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
