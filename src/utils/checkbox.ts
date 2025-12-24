/**
 * Checkbox utility functions
 */

import type { Item } from "../types/Item.ts";
import { setManualProgress, getManualProgress } from "../manual-progress.ts";

/**
 * Determine the "completed" value for an item based on its type
 */
function getCompletedValueForItem(item: Item): unknown {
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
    } else {
      // Toggle on - set this item
      setManualProgress(item.id, completedValue);

      // If this is a mutually exclusive item, clear others in the group
      if (item.unobtainable && item.group && getGroupItems) {
        const groupItems = getGroupItems(item.group);
        for (const groupItem of groupItems) {
          if (groupItem.id !== item.id) {
            setManualProgress(groupItem.id, undefined);
          }
        }
      }

      // If this is an upgrade or has upgrades, clear related items
      // (but skip items with the same ID, as they share the same storage key)
      if ((item.upgradeOf || item.type === "tool") && getUpgradeRelated) {
        const relatedItems = getUpgradeRelated(item);
        for (const relatedItem of relatedItems) {
          if (relatedItem.id !== item.id) {
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
