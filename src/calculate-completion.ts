/**
 * Calculate overall completion percentage including manual progress
 */

import bossesJSON from "./data/bosses.json" with { type: "json" };
import completionJSON from "./data/completion.json" with { type: "json" };
import essentialsJSON from "./data/essentials.json" with { type: "json" };
import journalJSON from "./data/journal.json" with { type: "json" };
import mainJSON from "./data/main.json" with { type: "json" };
import miniBossesJSON from "./data/mini-bosses.json" with { type: "json" };
import scenesJSON from "./data/scenes.json" with { type: "json" };
import wishesJSON from "./data/wishes.json" with { type: "json" };
import { completionValue } from "./elements.ts";
import { getManualValue, isManuallySet } from "./manual-progress.ts";
import {
  getSaveData,
  getSaveDataFlags,
  getSaveDataValue,
} from "./save-data.ts";
import type { Category } from "./types/Category.ts";
import type { Item } from "./types/Item.ts";

function collectAllItems(): readonly Item[] {
  const categories = [
    ...(mainJSON.categories as Category[]),
    ...(essentialsJSON.categories as Category[]),
    ...(bossesJSON.categories as Category[]),
    ...(miniBossesJSON.categories as Category[]),
    ...(completionJSON.categories as Category[]),
    ...(wishesJSON.categories as Category[]),
    ...(journalJSON.categories as Category[]),
    ...(scenesJSON.categories as Category[]),
  ];

  return categories.flatMap((c) => c.items);
}

function getUnlocked(item: Item, value: unknown): boolean {
  // First check if manually set - if so, use manual value instead
  if (isManuallySet(item.id)) {
    value = getManualValue(item.id);
  }

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

  if (item.type === "quill" && typeof value === "number") {
    return item.id === `QuillState_${value}` && [1, 2, 3].includes(value);
  }

  if (item.type === "journal") {
    const numberValue = typeof value === "number" ? value : 0;
    const { required } = item;
    return numberValue >= required || value === true;
  }

  if (item.type === "anyOf") {
    const anyOfResults: unknown[] = Array.isArray(value) ? value : [];
    return item.anyOf.some((check, index) => {
      const someValue = anyOfResults[index];

      const evaluateCheck = (): boolean => {
        switch (check.type) {
          case "flag":
          case "sceneBool":
          case "sceneVisited": {
            return someValue === true;
          }

          case "flagInt": {
            return typeof someValue === "number" ? someValue >= 1 : false;
          }

          case "level": {
            const current = typeof someValue === "number" ? someValue : 0;
            return current >= check.required;
          }
        }
      };

      return evaluateCheck();
    });
  }

  if (item.type === "key") {
    return value === true;
  }

  if (item.type === "sceneVisited") {
    // If manually set to true, return true
    if (value === true) {
      return true;
    }

    // Otherwise check save data
    const visitedScenes = getSaveData()?.playerData.scenesVisited ?? [];
    return Array.isArray(visitedScenes) && visitedScenes.includes(item.scene);
  }

  return value === true || value === "collected" || value === "deposited";
}

/**
 * Calculate and update the completion percentage display
 */
export function updateCompletionPercentage(): void {
  const allItems = collectAllItems();
  const saveData = getSaveData();
  const saveDataFlags = getSaveDataFlags();

  let totalItems = 0;
  let completedItems = 0;

  // Count obtained groups for unobtainable items
  const obtainedGroups = new Set<string>();
  for (const item of allItems) {
    const value = getSaveDataValue(saveData, saveDataFlags, item);
    if (
      typeof item.group === "string"
      && item.group.trim() !== ""
      && getUnlocked(item, value)
    ) {
      obtainedGroups.add(item.group);
    }
  }

  for (const item of allItems) {
    // Skip tool upgrades (they don't count toward completion)
    if (item.type === "tool" && item.upgradeOf !== undefined) {
      continue;
    }

    const value = getSaveDataValue(saveData, saveDataFlags, item);
    const unlocked = getUnlocked(item, value);

    // Skip unobtainable items if another in the group was obtained
    if (
      saveData !== undefined
      && item.unobtainable === true
      && typeof item.group === "string"
      && item.group.trim() !== ""
      && obtainedGroups.has(item.group)
      && !unlocked
    ) {
      continue;
    }

    totalItems++;
    if (unlocked) {
      completedItems++;
    }
  }

  // Calculate percentage
  const percentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Update the display
  completionValue.textContent = `${percentage}%`;
}
