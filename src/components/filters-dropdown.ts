/** Filters dropdown component (mobile/tablet only) Syncs with the desktop filter checkboxes */

import { getHTMLElement, getHTMLInputElement } from "../elements.ts";

const filtersDropdownButton = getHTMLElement("filters-dropdown-button");
const filtersDropdownMenu = getHTMLElement("filters-dropdown-menu");

// Desktop checkboxes
const showOnlyMissing = getHTMLInputElement("show-only-missing");
const showProgressOnly = getHTMLInputElement("show-progress-only");
const showSpoilers = getHTMLInputElement("show-spoilers");

// Mobile checkboxes
const showOnlyMissingMobile = getHTMLInputElement("show-only-missing-mobile");
const showProgressOnlyMobile = getHTMLInputElement("show-progress-only-mobile");
const showSpoilersMobile = getHTMLInputElement("show-spoilers-mobile");

export function initFiltersDropdown(): void {
  // Sync initial state
  showOnlyMissingMobile.checked = showOnlyMissing.checked;
  showProgressOnlyMobile.checked = showProgressOnly.checked;
  showSpoilersMobile.checked = showSpoilers.checked;

  // Toggle dropdown visibility
  filtersDropdownButton.addEventListener("click", (e) => {
    e.stopPropagation();
    filtersDropdownMenu.classList.toggle("hidden");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !filtersDropdownMenu.contains(e.target as Node)
      && !filtersDropdownButton.contains(e.target as Node)
    ) {
      filtersDropdownMenu.classList.add("hidden");
    }
  });

  // Sync mobile -> desktop
  showOnlyMissingMobile.addEventListener("change", () => {
    showOnlyMissing.checked = showOnlyMissingMobile.checked;
    showOnlyMissing.dispatchEvent(new Event("change", { bubbles: true }));
  });

  showProgressOnlyMobile.addEventListener("change", () => {
    showProgressOnly.checked = showProgressOnlyMobile.checked;
    showProgressOnly.dispatchEvent(new Event("change", { bubbles: true }));
  });

  showSpoilersMobile.addEventListener("change", () => {
    showSpoilers.checked = showSpoilersMobile.checked;
    showSpoilers.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Sync desktop -> mobile
  showOnlyMissing.addEventListener("change", () => {
    showOnlyMissingMobile.checked = showOnlyMissing.checked;
  });

  showProgressOnly.addEventListener("change", () => {
    showProgressOnlyMobile.checked = showProgressOnly.checked;
  });

  showSpoilers.addEventListener("change", () => {
    showSpoilersMobile.checked = showSpoilers.checked;
  });
}
