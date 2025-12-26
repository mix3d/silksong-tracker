/**
 * Combined Upload/Reset button that switches based on whether data is loaded (Desktop sidebar -
 * mobile uses mobile-drawers.ts for the drawer action button)
 */

import { dropzone, getDataActionBtn, uploadOverlay } from "../elements.ts";
import { clearAllData, getSaveData } from "../save-data.ts";

let dataActionBtn: HTMLButtonElement | null = null;

/** Update the button to show Upload or Reset based on data state */
function updateButtonState() {
  if (!dataActionBtn) {
    return;
  }

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Show Reset button
    dataActionBtn.innerHTML =
      '<i class="fa-solid fa-trash-can"></i> <span>Reset Data</span>';
    dataActionBtn.className = "sidebar-action-btn btn-reset";
    dataActionBtn.title = "Reset all data";
    dataActionBtn.setAttribute("aria-label", "Reset all data");
  } else {
    // Show Upload button
    dataActionBtn.innerHTML =
      '<i class="fa-solid fa-upload"></i> <span>Upload Save</span>';
    dataActionBtn.className = "sidebar-action-btn";
    dataActionBtn.title = "Upload save";
    dataActionBtn.setAttribute("aria-label", "Upload save");
  }
}

/** Handle button click - either upload or reset based on current state */
function handleClick(e: Event) {
  e.preventDefault();

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Reset action - ask for confirmation
    if (
      confirm("Are you sure you want to reset all data? This cannot be undone.")
    ) {
      clearAllData();
    }
  } else {
    // Upload action
    uploadOverlay.classList.remove("hidden");
    dropzone.focus();
  }
}

/** Initialize the data action button (desktop sidebar) */
export function initDataActionBtn(): void {
  dataActionBtn = getDataActionBtn();

  // Skip if button doesn't exist (may not be rendered in some views)
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
