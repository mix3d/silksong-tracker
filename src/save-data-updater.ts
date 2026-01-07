/**
 * Save Data Updater
 *
 * This module handles updating the save data structure when users manually check/uncheck items. All
 * manual changes modify the actual save data object, ensuring a single source of truth.
 */

import { isObject } from "complete-common";
import type { SilksongSave } from "./save-parser";
import type { Item } from "./types/Item.ts";
import { normalizeString, normalizeStringWithUnderscores } from "./utils.ts";

const MANUAL_SAVE_KEY = "silksong-manual-save";

/** Create an empty save data structure for manual tracking */
export function createEmptySaveData(): SilksongSave {
  return {
    playerData: {
      Collectables: { savedData: [] },
      completionPercentage: 0,
      EnemyJournalKillData: { list: [] },
      MateriumCollected: { savedData: [] },
      MementosDeposited: { savedData: [] },
      geo: 0,
      permadeathMode: 0,
      playTime: 0,
      QuestCompletionData: { savedData: [] },
      Relics: { savedData: [] },
      scenesVisited: [],
      ShellShards: 0,
      ToolEquips: { savedData: [] },
      Tools: { savedData: [] },

      // Keys
      PurchasedBonebottomFaithToken: false,
      CollectedDustCageKey: false,
      MerchantEnclaveSimpleKey: false,
      BallowGivenKey: false,
      collectedWardKey: false,
      collectedWardBossKey: false,
      HasSlabKeyC: false,
      HasSlabKeyA: false,
      HasSlabKeyB: false,
      PurchasedArchitectKey: false,
    } as SilksongSave["playerData"],
    sceneData: {
      persistentBools: { serializedList: [] },
      persistentInts: { serializedList: [] },
    },
  };
}

/** Update save data for a specific item with a new value */
export function updateSaveDataForItem(
  saveData: SilksongSave,
  saveDataFlags: Record<string, unknown> | undefined,
  item: Item,
  value: unknown,
): void {
  const { playerData, sceneData } = saveData;
  const playerDataExpanded: Record<string, unknown> =
    playerData as unknown as Record<string, unknown>;
  const sceneDataExpanded = sceneData as unknown as Record<string, unknown>;

  switch (item.type) {
    case "flag":
    case "boss": {
      const { flag } = item;
      if (flag) {
        playerDataExpanded[flag] = value;
      }
      break;
    }

    case "key": {
      // Keys can have multiple flags
      if ("flags" in item && item.flags && Array.isArray(item.flags)) {
        for (const flag of item.flags) {
          playerDataExpanded[flag] = value;
        }
      } else if ("flag" in item && item.flag) {
        playerDataExpanded[item.flag] = value;
      }
      break;
    }

    case "collectable": {
      const { flag } = item;
      const collectables = playerData.Collectables;

      let entry = collectables.savedData.find((e) => e.Name === flag);
      if (!entry) {
        entry = { Name: flag, Data: {} };
        collectables.savedData.push(entry);
      }

      entry.Data["Amount"] = typeof value === "number" ? value : value ? 1 : 0;
      break;
    }

    case "tool": {
      const { flag } = item;
      const normalizedFlag = normalizeString(flag);

      const tools = playerData.Tools;
      let entry = tools.savedData.find(
        (e) => normalizeString(e.Name) === normalizedFlag,
      );
      if (!entry) {
        entry = { Name: flag, Data: {} };
        tools.savedData.push(entry);
      }

      entry.Data["IsUnlocked"] = value === true;
      break;
    }

    case "quest": {
      const { flag } = item;
      const normalizedFlag = normalizeString(flag);

      const quests = playerData.QuestCompletionData;
      let entry = quests.savedData.find(
        (e) => normalizeString(e.Name) === normalizedFlag,
      );
      if (!entry) {
        entry = { Name: flag, Data: {} };
        quests.savedData.push(entry);
      }

      if (value === "completed" || value === true) {
        entry.Data["IsCompleted"] = true;
        entry.Data["IsAccepted"] = true;
      } else if (value === "accepted") {
        entry.Data["IsCompleted"] = false;
        entry.Data["IsAccepted"] = true;
      } else {
        entry.Data["IsCompleted"] = false;
        entry.Data["IsAccepted"] = false;
      }
      break;
    }

    case "level": {
      const { flag } = item;
      playerDataExpanded[flag] = typeof value === "number" ? value : 0;
      break;
    }

    case "quill": {
      const { flag } = item;
      if (value && typeof value === "number" && value > 0) {
        playerDataExpanded["hasQuill"] = true;
        playerDataExpanded[flag] = value;
      } else {
        playerDataExpanded["hasQuill"] = false;
        playerDataExpanded[flag] = 0;
      }
      break;
    }

    case "journal": {
      const { flag, required } = item;
      const journal = playerData.EnemyJournalKillData;

      let entry = journal.list.find((e) => e.Name === flag);
      if (!entry) {
        entry = {
          Name: flag,
          Record: { Kills: 0, HasBeenSeen: false },
        };
        journal.list.push(entry);
      }

      if (value === true) {
        entry.Record.Kills = required;
        entry.Record.HasBeenSeen = true;
      } else {
        entry.Record.Kills = typeof value === "number" ? value : 0;
      }
      break;
    }

    case "sceneVisited": {
      const { scene } = item;
      if (value === true) {
        if (!playerData.scenesVisited.includes(scene)) {
          playerData.scenesVisited.push(scene);
        }
      } else {
        const index = playerData.scenesVisited.indexOf(scene);
        if (index !== -1) {
          playerData.scenesVisited.splice(index, 1);
        }
      }
      break;
    }

    case "sceneBool": {
      const { scene, flag } = item;
      const normalizedScene = normalizeStringWithUnderscores(scene);
      const normalizedFlag = normalizeStringWithUnderscores(flag);

      // Update in sceneData flags
      sceneDataExpanded.persistentBools ||= { serializedList: [] };

      const persistentBools = sceneDataExpanded.persistentBools as {
        serializedList: unknown[];
      };
      const existingEntry = persistentBools.serializedList.find(
        (e: unknown) =>
          isObject(e) && e["SceneName"] === scene && e["ID"] === flag,
      );

      if (value === true) {
        if (!existingEntry) {
          persistentBools.serializedList.push({
            SceneName: scene,
            ID: flag,
            Value: true,
          });
        }
      } else if (existingEntry) {
        const index = persistentBools.serializedList.indexOf(existingEntry);
        if (index !== -1) {
          persistentBools.serializedList.splice(index, 1);
        }
      }
      break;
    }

    case "relic": {
      const { flag } = item;
      const relics = playerData.Relics;

      let entry = relics.savedData.find((e) => e.Name === flag);
      if (!entry) {
        entry = { Name: flag, Data: {} };
        relics.savedData.push(entry);
      }

      if (value === "deposited") {
        entry.Data["IsDeposited"] = true;
        entry.Data["IsCollected"] = true;
        entry.Data["HasSeenInRelicBoard"] = true;
      } else if (value === "collected") {
        entry.Data["IsDeposited"] = false;
        entry.Data["IsCollected"] = true;
        entry.Data["HasSeenInRelicBoard"] = false;
      } else {
        entry.Data["IsDeposited"] = false;
        entry.Data["IsCollected"] = false;
        entry.Data["HasSeenInRelicBoard"] = false;
      }
      break;
    }

    case "materium": {
      const { flag } = item;
      const materium = playerData.MateriumCollected;

      let entry = materium.savedData.find((e) => e.Name === flag);
      if (!entry) {
        entry = { Name: flag, Data: {} };
        materium.savedData.push(entry);
      }

      if (value === "deposited") {
        entry.Data["IsCollected"] = true;
        entry.Data["HasSeenInRelicBoard"] = true;
      } else if (value === "collected") {
        entry.Data["IsCollected"] = true;
        entry.Data["HasSeenInRelicBoard"] = false;
      } else {
        entry.Data["IsCollected"] = false;
        entry.Data["HasSeenInRelicBoard"] = false;
      }
      break;
    }

    case "device": {
      const { scene, flag, relatedFlag } = item;
      const normalizedScene = normalizeStringWithUnderscores(scene);
      const normalizedFlag = normalizeStringWithUnderscores(flag);

      if (value === "deposited") {
        playerDataExpanded[relatedFlag] = true;

        // Also set in scene data
        sceneDataExpanded.persistentBools ||= { serializedList: [] };
        const persistentBools = sceneDataExpanded.persistentBools as {
          serializedList: unknown[];
        };
        const existingEntry = persistentBools.serializedList.find(
          (e: unknown) =>
            isObject(e) && e["SceneName"] === scene && e["ID"] === flag,
        );
        if (!existingEntry) {
          persistentBools.serializedList.push({
            SceneName: scene,
            ID: flag,
            Value: true,
          });
        }
      } else if (value === "collected") {
        playerDataExpanded[relatedFlag] = false;

        sceneDataExpanded.persistentBools ||= { serializedList: [] };
        const persistentBools = sceneDataExpanded.persistentBools as {
          serializedList: unknown[];
        };
        const existingEntry = persistentBools.serializedList.find(
          (e: unknown) =>
            isObject(e) && e["SceneName"] === scene && e["ID"] === flag,
        );
        if (!existingEntry) {
          persistentBools.serializedList.push({
            SceneName: scene,
            ID: flag,
            Value: true,
          });
        }
      } else {
        playerDataExpanded[relatedFlag] = false;

        if (sceneDataExpanded.persistentBools) {
          const persistentBools = sceneDataExpanded.persistentBools as {
            serializedList: unknown[];
          };
          const existingEntry = persistentBools.serializedList.find(
            (e: unknown) =>
              isObject(e) && e["SceneName"] === scene && e["ID"] === flag,
          );
          if (existingEntry) {
            const index = persistentBools.serializedList.indexOf(existingEntry);
            if (index !== -1) {
              persistentBools.serializedList.splice(index, 1);
            }
          }
        }
      }
      break;
    }

    case "flagInt": {
      const { flag } = item;
      playerDataExpanded[flag] =
        typeof value === "number" ? value : value ? 1 : 0;
      break;
    }

    case "anyOf": {
      // For anyOf items, we need to update all the conditions If setting to "completed/true", we
      // set the first condition to true If setting to "uncompleted/false", we set all conditions to
      // false
      const isCompleting = value === true || value === "completed";

      for (let i = 0; i < item.anyOf.length; i++) {
        const check = item.anyOf[i];

        // Create a mock item for this specific check
        const mockItem = {
          ...item,
          type: check.type,
          flag: "flag" in check ? check.flag : undefined,
          scene: "scene" in check ? check.scene : undefined,
          required: "required" in check ? check.required : undefined,
        } as Item;

        // For completing, only set the first condition to true (to avoid conflicts) For
        // uncompleting, set all conditions to false
        if (isCompleting && i === 0) {
          // Set first condition to completed value
          const completedValue = check.type === "level" ? check.required : true;
          updateSaveDataForItem(
            saveData,
            saveDataFlags,
            mockItem,
            completedValue,
          );
        } else if (!isCompleting) {
          // Set all conditions to uncompleted value
          const uncompletedValue = check.type === "level" ? 0 : false;
          updateSaveDataForItem(
            saveData,
            saveDataFlags,
            mockItem,
            uncompletedValue,
          );
        }
      }
      break;
    }
  }
}

/** Save manual save data to localStorage */
export function saveManualSaveData(saveData: SilksongSave): void {
  try {
    localStorage.setItem(MANUAL_SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error("Error saving manual save data:", error);
  }
}

/** Load manual save data from localStorage */
export function loadManualSaveData(): SilksongSave | undefined {
  try {
    const stored = localStorage.getItem(MANUAL_SAVE_KEY);
    if (stored === null) {
      return undefined;
    }
    return JSON.parse(stored) as SilksongSave;
  } catch (error) {
    console.error("Error loading manual save data:", error);
    return undefined;
  }
}

/** Clear manual save data from localStorage */
export function clearManualSaveData(): void {
  try {
    localStorage.removeItem(MANUAL_SAVE_KEY);
  } catch (error) {
    console.error("Error clearing manual save data:", error);
  }
}
