/**
 * Combined Upload/Reset button that switches based on whether data is loaded
 * (Desktop only - mobile uses drawer actions)
 */

import { getDataActionBtn, uploadOverlay, dropzone } from "../elements.ts";
import { getSaveData } from "../save-data.ts";
import { clearAllData } from "../save-data.ts";

let dataActionBtn: HTMLButtonElement | null = null;

/**
 * Update the button to show Upload or Reset based on data state
 */
function updateButtonState(): void {
  if (!dataActionBtn) return;

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Show Reset button
    dataActionBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> <span>Reset</span>';
    dataActionBtn.className = "btn-reset";
    dataActionBtn.title = "Reset all data";
    dataActionBtn.setAttribute("aria-label", "Reset all data");
  } else {
    // Show Upload button
    dataActionBtn.innerHTML = '<i class="fa-solid fa-upload"></i> <span>Upload</span>';
    dataActionBtn.className = "btn-icon";
    dataActionBtn.title = "Upload save";
    dataActionBtn.setAttribute("aria-label", "Upload save");
  }
}

/**
 * Handle button click - either upload or reset based on current state
 */
function handleClick(e: Event): void {
  e.preventDefault();

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Reset action
    clearAllData();
  } else {
    // Upload action
    uploadOverlay.classList.remove("hidden");
    dropzone.focus();
  }
}

/**
 * Initialize the data action button (desktop only)
 */
export function initDataActionBtn(): void {
  dataActionBtn = getDataActionBtn();

  // Skip if button doesn't exist (mobile view)
  if (!dataActionBtn) {
    return;
  }

  // Set initial state
  updateButtonState();

  // Add click handler
  dataActionBtn.addEventListener("click", handleClick);

  // Listen for data changes to update button state
  globalThis.addEventListener("save-data-changed", updateButtonState);
}
