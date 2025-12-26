/**
 * Calculate overall completion percentage with proper category weighting
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
import {
  getSaveData,
  getSaveDataFlags,
  getSaveDataMode,
  getSaveDataValue,
} from "./save-data.ts";
import type { Category } from "./types/Category.ts";
import type { Item } from "./types/Item.ts";

// Category weights based on requirements
const CATEGORY_WEIGHTS: Record<string, { totalPercent: number; itemCount: number }> = {
  // Needle upgrades — 4% total (4 upgrades)
  "needle-upgrades": { totalPercent: 4, itemCount: 4 },
  
  // Ancient Masks — 5% total (20 mask shards = 5 masks)
  "ancient-masks": { totalPercent: 5, itemCount: 20 },

  // Silk Spool — 9% total (18 spool fragments = 9 spools)
  "silk-capacity": { totalPercent: 9, itemCount: 18 },
  
  // Silk Hearts — 3% total (3 hearts)
  "silk-regen-max": { totalPercent: 3, itemCount: 3 },
  
  // Miscellaneous — 2% total (Sylphsong, Everbloom)
  "miscellaneous": { totalPercent: 2, itemCount: 2 },
  
  // Crests — 6% total (6 crests)
  "crests": { totalPercent: 6, itemCount: 6 },
  
  // Silk Skills — 6% total (6 skills)
  "silk-skills": { totalPercent: 6, itemCount: 6 },
  
  // Crafting Kit Upgrades — 4% total (4 upgrades)
  "crafting-kit": { totalPercent: 4, itemCount: 4 },
  
  // Tool Pouch Upgrades — 4% total (4 upgrades)
  "tool-pouch": { totalPercent: 4, itemCount: 4 },
  
  // Abilities — 6% total (6 abilities)
  "abilities": { totalPercent: 6, itemCount: 6 },
  
  // Tools — 51% total (51 tools)
  "tools": { totalPercent: 51, itemCount: 51 },
};

// Shared countKey items that count as one
const SHARED_COUNT_GROUPS = new Set([
  "claw-mirror", // Claw Mirror / Claw Mirrors
  "curveclaw", // Curveclaw / Curvesickle
  "dead-bugs-purse", // Dead Bug's Purse / Shell Satchel
  "druids-eye", // Druid's Eye / Druid's Eyes
]);

// Items with isCounted = false (don't count toward completion)
const UNCOUNTED_ITEMS = new Set([
  "Lifeblood Syringe", // Plasmium Phial - used only for collecting plasmium in wishes
]);

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

/**
 * Check if an item counts toward the 100% completion percentage
 */
export function itemCountsTowardCompletion(item: Item): boolean {
  return getItemCategory(item) !== null;
}

function getItemCategory(item: Item): string | null {
  // Map items to their completion categories based on flags and types

  // Needle upgrades
  if (item.flag === "nailUpgrades" && item.type === "level") {
    // Skip base needle (required: 0)
    if (item.required === 0) return null;
    return "needle-upgrades";
  }

  // Ancient Masks - individual mask shards (20 total, 4 per mask = 5 masks)
  if (item.label?.includes("Mask Shard") || item.mapCategory === "mask-shards") {
    return "ancient-masks";
  }

  // Silk Spools - individual spool fragments (18 total, 2 per spool = 9 spools)
  if (item.label?.includes("Spool Fragment") || item.mapCategory === "spool-fragments") {
    return "silk-capacity";
  }
  
  // Silk Hearts
  if (item.flag?.includes("Silk Heart") || item.label?.includes("Silk Heart") || item.mapCategory === "silk-hearts") {
    return "silk-regen-max";
  }
  
  // Miscellaneous (Everbloom and Bind Eva)
  if (item.flag === "White Flower" || item.flag === "HasBoundCrestUpgrader" || item.mapCategory === "miscellaneous") {
    return "miscellaneous";
  }
  
  // Crests
  if (item.flag === "Toolmaster" || item.flag === "Warrior" || item.flag === "Reaper" ||
      item.flag === "Spell" || item.flag === "Wanderer" || item.flag === "Witch") {
    return "crests";
  }
  
  // Silk Skills
  if (item.flag === "Parry" || item.flag === "Silk Boss Needle" || item.flag === "Silk Charge" ||
      item.flag === "Silk Spear" || item.flag === "Silk Bomb" || item.flag === "Thread Sphere") {
    return "silk-skills";
  }
  
  // Crafting Kit
  if (item.flag?.includes("Crafting") || item.label?.includes("Crafting Kit") || item.mapCategory === "crafting-kit") {
    // Skip base level (required: 0)
    if (item.type === "level" && item.required === 0) return null;
    return "crafting-kit";
  }

  // Tool Pouch
  if (item.flag?.includes("Tool Pouch") || item.label?.includes("Tool Pouch") || item.mapCategory === "tool-pouch") {
    // Skip base level (required: 0)
    if (item.type === "level" && item.required === 0) return null;
    return "tool-pouch";
  }
  
  // Abilities
  const abilityFlags = ["hasDash", "hasWalljump", "hasNeedolin", "hasHarpoonDash", "hasSuperJump", "hasChargeSlash"];
  if (abilityFlags.includes(item.flag) || item.mapCategory === "ability") {
    return "abilities";
  }
  
  // Tools - most items with type "tool" or specific tool flags
  if (item.type === "tool") {
    // Skip upgrades (they have upgradeOf property)
    if (item.upgradeOf !== undefined) {
      return null;
    }
    
    // Skip uncounted items
    if (item.flag && UNCOUNTED_ITEMS.has(item.flag)) {
      return null;
    }
    
    return "tools";
  }
  
  // Also check for tools by flag name
  const toolFlags = [
    "Wallcling", "Barbed Wire", "Dazzle Bind", "Cogwork Flier", "Cogwork Saw",
    "Compass", "Conch Drill", "Curve Claws", "Dead Mans Purse", "Screw Attack",
    "Mosscreep Tool 1", "Flea Charm", "Flea Brew", "Flintstone", "Fractured Mask",
    "Quickbind", "Longneedle", "Harpoon", "Lava Charm", "Rosary Magnet",
    "Magnetite Dice", "Revenge Crystal", "Multibind", "Pinstress Tool", "Pimpilo",
    "Lifeblood Syringe", "Poison Pouch", "Quick Sling", "Reserve Bind",
    "Rosary Cannon", "Brolly Spike", "Scuttlebrace", "Bone Necklace",
    "WebShot Architect", "WebShot Forge", "WebShot Weaver", "Sprintmaster",
    "Thief Claw", "Musician Charm", "Spool Extender", "Sting Shard",
    "Straight Pin", "Tack", "Thief Charm", "Tri Pin", "Shakra Ring",
    "Zap Imbuement", "Lightning Rod", "Bell Bind", "White Ring",
    "Weighted Anklet", "Wisp Lantern", "Maggot Charm"
  ];
  
  if (item.flag && toolFlags.includes(item.flag)) {
    return "tools";
  }
  
  return null;
}

function getUnlocked(item: Item, value: unknown): boolean {
  // Manual progress is now integrated into the save data directly

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
 * Calculate and update the completion percentage display using weighted categories
 */
export function updateCompletionPercentage(): void {
  const allItems = collectAllItems();
  const saveData = getSaveData();
  const saveDataFlags = getSaveDataFlags();

  // Track completion per category
  const categoryProgress: Record<string, { completed: number; total: number }> = {};
  
  // Initialize all categories
  for (const categoryKey of Object.keys(CATEGORY_WEIGHTS)) {
    categoryProgress[categoryKey] = { completed: 0, total: 0 };
  }

  // Track obtained groups for unobtainable items and shared count keys
  const obtainedGroups = new Set<string>();
  const obtainedSharedGroups = new Set<string>();
  
  for (const item of allItems) {
    const value = getSaveDataValue(saveData, saveDataFlags, item);
    const unlocked = getUnlocked(item, value);
    
    if (unlocked && typeof item.group === "string" && item.group.trim() !== "") {
      obtainedGroups.add(item.group);
    }
    
    // Track shared count groups (only count first obtained)
    if (unlocked && item.exclusiveGroup && SHARED_COUNT_GROUPS.has(item.exclusiveGroup)) {
      obtainedSharedGroups.add(item.exclusiveGroup);
    }
  }

  const toolsList: string[] = []; // Debug: track ALL counted tools
  const saveDataMode = getSaveDataMode();

  for (const item of allItems) {
    const category = getItemCategory(item);
    if (!category) continue;

    // Skip items that don't match the current save mode
    if (item.mode !== undefined && saveData !== undefined) {
      if (item.mode !== saveDataMode) {
        continue;
      }
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

    // Handle shared count groups - only count first one
    if (item.exclusiveGroup && SHARED_COUNT_GROUPS.has(item.exclusiveGroup)) {
      if (obtainedSharedGroups.has(item.exclusiveGroup)) {
        // Only count once per group
        if (unlocked) {
          // If this is the first unlocked in the group
          const firstUnlocked = !Array.from(allItems).some((otherItem) => {
            if (otherItem.id === item.id) return false;
            if (otherItem.exclusiveGroup !== item.exclusiveGroup) return false;
            const otherValue = getSaveDataValue(saveData, saveDataFlags, otherItem);
            return getUnlocked(otherItem, otherValue);
          });

          if (firstUnlocked) {
            categoryProgress[category].total++;
            categoryProgress[category].completed++;
            if (category === "tools") toolsList.push(`${item.label ?? item.id} (shared)`);
          }
        }
        continue;
      }
    }

    // Debug: track ALL items counted in tools (before incrementing)
    if (category === "tools") {
      toolsList.push(`${item.label ?? item.id}${unlocked ? ' ✓' : ' ✗'}`);
    }

    categoryProgress[category].total++;
    if (unlocked) {
      categoryProgress[category].completed++;
    }
  }

  // Debug: log all tools
  if (toolsList.length > 0) {
    console.log(`ALL Tools being counted (${toolsList.length} items):`, toolsList.sort());
  }

  // Calculate weighted percentage
  let totalPercentage = 0;

  console.log('=== COMPLETION CALCULATION ===');
  for (const [categoryKey, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const progress = categoryProgress[categoryKey];

    if (progress.total > 0) {
      const categoryCompletion = progress.completed / progress.total;
      const weightedPercentage = categoryCompletion * weight.totalPercent;
      totalPercentage += weightedPercentage;
      console.log(`${categoryKey}: ${progress.completed}/${progress.total} items = ${(categoryCompletion * 100).toFixed(1)}% → ${weightedPercentage.toFixed(2)}% of total`);
    } else {
      console.log(`${categoryKey}: 0/0 items (expected ${weight.itemCount}) → MISSING ${weight.totalPercent}%`);
    }
  }
  console.log(`Total: ${totalPercentage.toFixed(2)}% (rounded to ${Math.round(totalPercentage)}%)`);
  console.log('==============================');

  // Round to nearest integer
  const percentage = Math.round(totalPercentage);

  // Update the display
  completionValue.textContent = `${percentage}%`;
}
