/**
 * Checkbox utility functions
 */

import type { Item } from "../types/Item.ts";
import { toggleManualProgress } from "../manual-progress.ts";

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
    const completedValue = getCompletedValueForItem(item);
    toggleManualProgress(item.id, completedValue);
    if (onClick) {
      onClick(e);
    }
  });

  return checkbox;
}
