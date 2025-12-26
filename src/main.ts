import { initActsDropdown } from "./components/acts-dropdown.ts";
import { initBackToTop } from "./components/back-to-top.ts";
import { initDataActionBtn } from "./components/data-action-btn.ts";
import { initDesktopPinsToggle } from "./components/desktop-pins-toggle.ts";
import { initFiltersDropdown } from "./components/filters-dropdown.ts";
import {
  cleanupMobileDrawers,
  initMobileDrawers,
} from "./components/mobile-drawers.ts";
import { initShowOnlyMissing } from "./components/show-only-missing.ts";
import { initShowProgressOnly } from "./components/show-progress-only.ts";
import { initShowSpoilers } from "./components/show-spoilers.ts";
import {
  getStoredActiveTab,
  initSidebarItems,
  toggleTocVisibility,
} from "./components/sidebar-items.ts";
import {
  closeInfoModal,
  closeUploadModal,
  dropzone,
  fileInput,
  getHTMLElement,
  getHTMLElements,
  infoOverlay,
  logoLink,
  uploadOverlay,
  worldMap,
  getShowRoomNamesToggle,
} from "./elements.ts";
import { renderActiveTab } from "./render-tab.ts";
import { clearAllData, handleSaveFile } from "./save-data.ts";
import { initWorldMapPins } from "./tabs/progress.ts";
import { initRawSaveData } from "./tabs/raw-save.ts";
import { showToast } from "./utils.ts";

initWorldMapPins();

logoLink.addEventListener("click", (e) => {
  e.preventDefault();
  clearAllData();
});

function main() {
  document.addEventListener("DOMContentLoaded", () => {
    initComponents();

    renderActiveTab();
  });
}

function initComponents() {
  // Top-nav
  initActsDropdown();
  initFiltersDropdown();
  initShowOnlyMissing();
  initShowProgressOnly();
  initShowSpoilers();
  initDataActionBtn();

  // Left-nav
  initSidebarItems();

  // Tabs
  initRawSaveData();

  // Other
  initBackToTop();

  // Initialize drawers (context drawer needed on all screens for map filters)
  initMobileDrawers();

  // Desktop pins toggle
  initDesktopPinsToggle();

  // Handle resize across mobile/tablet/desktop threshold
  let wasMobileOrTablet = window.innerWidth <= 1024;
  window.addEventListener("resize", () => {
    const isMobileOrTablet = window.innerWidth <= 1024;

    if (isMobileOrTablet !== wasMobileOrTablet) {
      wasMobileOrTablet = isMobileOrTablet;

      if (isMobileOrTablet) {
        initMobileDrawers();
      } else {
        cleanupMobileDrawers();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Mobile action button (Upload/Reset toggle) is now handled by mobile-drawers.ts

  function closeUploadModalFunc() {
    uploadOverlay.classList.add("hidden");
  }

  closeUploadModal.addEventListener("click", closeUploadModalFunc);
  uploadOverlay.addEventListener("click", (e) => {
    if (e.target === uploadOverlay) {
      closeUploadModalFunc();
    }
  });

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  for (const type of ["dragenter", "dragover"]) {
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  }
  for (const type of ["dragleave", "drop"]) {
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  }

  dropzone.addEventListener("drop", (dragEvent) => {
    const { dataTransfer } = dragEvent;
    if (dataTransfer === null) {
      return;
    }

    const { files } = dataTransfer;
    const firstFile = files[0];

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleSaveFile(firstFile);
  });

  // Map Act Selector.
  // Handle map toggle: Show room names vs Act 3 map
  const img = worldMap as HTMLImageElement;
  const roomNamesToggle = getShowRoomNamesToggle();

  if (roomNamesToggle) {
    roomNamesToggle.addEventListener("change", function onMapToggleChange() {
      if (roomNamesToggle.checked) {
        // Show room names map
        img.src = "/silksong-tracker/assets/ui/scene's_name_map.png";
        img.alt = "Pharloom Map - Room Names";
      } else {
        // Show Act 3 map (default)
        img.src = "/silksong-tracker/assets/ui/labelled_map_act3.png";
        img.alt = "Pharloom Map - Act 3";
      }
    });
  }

  const paths: Record<string, string> = {
    windows: String.raw`%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong`,
    mac: "~/Library/Application Support/unity.Team-Cherry.Silksong",
    linux: "~/.config/unity3d/Team Cherry/Hollow Knight Silksong",
    steam: String.raw`%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong`,
  };

  const pills = getHTMLElements(document, ".pill");
  for (const btn of pills) {
    btn.addEventListener("click", () => {
      const key = btn.textContent.trim().toLowerCase();
      const path = paths[key];

      if (path === undefined) {
        if (key === "steam cloud") {
          window.open(
            "https://store.steampowered.com/account/remotestorageapp/?appid=1030300",
            "_blank",
          );
          return;
        }

        showToast(`❌ No path available for: ${key}`);
        return;
      }

      navigator.clipboard
        .writeText(path)
        .then(() => {
          showToast("📋 Path copied to clipboard!");
        })
        .catch((error: unknown) => {
          console.error("Clipboard error:", error);
          showToast("❌ Unable to copy path.");
        });
    });
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  handleSaveFile(file);
});

document.addEventListener("DOMContentLoaded", () => {
  const tabs = getHTMLElements(document, ".tab");
  for (const section of tabs) {
    section.classList.add("hidden");
  }

  const activeTab = getStoredActiveTab();
  const activeSection = getHTMLElement(`${activeTab}-section`);
  activeSection.classList.remove("hidden");

  toggleTocVisibility(activeTab);

  closeInfoModal.addEventListener("click", () => {
    infoOverlay.classList.add("hidden");
  });
  infoOverlay.addEventListener("click", (e) => {
    if (e.target === infoOverlay) {
      infoOverlay.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      infoOverlay.classList.add("hidden");
    }
  });
});

main();
