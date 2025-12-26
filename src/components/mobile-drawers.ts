import { dropzone, getHTMLElement, uploadOverlay } from "../elements.ts";
import { clearAllData, getSaveData } from "../save-data.ts";
import { getStoredActiveTab } from "./sidebar-items.ts";

let tabsDrawerOpen = false;
let contextDrawerOpen = false;
let tabsDrawerInitialized = false;
let contextDrawerInitialized = false;

export function initMobileDrawers(): void {
  // Only init tabs drawer once on mobile/tablet
  const isMobileOrTablet = window.innerWidth <= 1024;
  if (isMobileOrTablet && !tabsDrawerInitialized) {
    initTabsDrawer();
    initMobileActionButton();
    tabsDrawerInitialized = true;
  }

  // Init context drawer once (needed for map filters on all screen sizes)
  if (!contextDrawerInitialized) {
    initContextDrawer();
    contextDrawerInitialized = true;
  }

  updateContextButton();
}

// ==================== TABS DRAWER (LEFT) ====================

function initTabsDrawer() {
  const toggleBtn = getHTMLElement("mobile-tabs-toggle");
  const drawer = getHTMLElement("mobile-tabs-drawer");
  const backdrop = getHTMLElement("mobile-tabs-backdrop");
  const closeBtn = drawer.querySelector("[data-drawer='tabs']")!;

  // Wire up mobile nav items (statically built in HTML)
  const mobileTabItems = document.querySelectorAll(
    ".mobile-tab-items .sidebar-item",
  );
  const desktopSidebarItems = document.querySelectorAll(
    ".sidebar .sidebar-item",
  );

  for (const mobileItem of mobileTabItems) {
    // Sync initial active state
    const desktopItem = [...desktopSidebarItems].find(
      (item) => item.dataset.tab === mobileItem.dataset.tab,
    );

    if (desktopItem && desktopItem.classList.contains("is-active")) {
      mobileItem.classList.add("is-active");
    }

    // Wire up click to trigger the desktop item's click (which has navigation logic)
    mobileItem.addEventListener("click", (e) => {
      e.preventDefault();

      // Trigger click on the corresponding desktop sidebar item
      if (desktopItem) {
        (desktopItem as HTMLAnchorElement).click();
      }

      // Close drawer
      closeTabsDrawer();
    });
  }

  // Event listeners
  toggleBtn.addEventListener("click", openTabsDrawer);
  closeBtn.addEventListener("click", closeTabsDrawer);
  backdrop.addEventListener("click", closeTabsDrawer);

  // Sync active state with desktop
  observeSidebarActiveState();
}

function openTabsDrawer() {
  // Close context drawer if open
  if (contextDrawerOpen) {
    closeContextDrawer();
  }

  const drawer = getHTMLElement("mobile-tabs-drawer");
  const backdrop = getHTMLElement("mobile-tabs-backdrop");

  drawer.classList.add("open");
  backdrop.classList.add("active");
  tabsDrawerOpen = true;

  // Prevent body scroll
  document.body.style.overflow = "hidden";
}

function closeTabsDrawer() {
  const drawer = getHTMLElement("mobile-tabs-drawer");
  const backdrop = getHTMLElement("mobile-tabs-backdrop");

  drawer.classList.remove("open");
  backdrop.classList.remove("active");
  tabsDrawerOpen = false;

  // Restore body scroll
  document.body.style.overflow = "";
}

function observeSidebarActiveState() {
  // Sync desktop sidebar active state to mobile
  const observer = new MutationObserver(() => {
    const desktopActiveItem = document.querySelector(
      ".sidebar .sidebar-item.is-active",
    );
    const mobileItems = document.querySelectorAll(
      ".mobile-tab-items .sidebar-item",
    );

    for (const mobileItem of mobileItems) {
      mobileItem.classList.remove("is-active");

      if (
        desktopActiveItem
        && mobileItem.dataset.tab === desktopActiveItem.dataset.tab
      ) {
        mobileItem.classList.add("is-active");
      }
    }

    // Update context button when tab changes
    updateContextButton();
  });

  const desktopSidebarItems = document.querySelectorAll(
    ".sidebar .sidebar-item",
  );
  for (const item of desktopSidebarItems) {
    observer.observe(item, { attributes: true, attributeFilter: ["class"] });
  }
}

// ==================== MOBILE ACTION BUTTON (UPLOAD/RESET TOGGLE) ====================

let mobileActionBtn: HTMLButtonElement | null = null;

/** Initialize the mobile drawer action button with Upload/Reset toggle logic */
function initMobileActionButton() {
  try {
    mobileActionBtn = document.querySelector("#mobile-data-action-btn")!;

    if (!mobileActionBtn) {
      return;
    }

    // Set initial state
    updateMobileActionButtonState();

    // Add click handler
    mobileActionBtn.addEventListener("click", handleMobileActionClick);

    // Listen for data changes to update button state
    globalThis.addEventListener(
      "save-data-changed",
      updateMobileActionButtonState,
    );
  } catch (error) {
    console.warn("Mobile action button not found:", error);
  }
}

/** Update the mobile button to show Upload or Reset based on data state */
function updateMobileActionButtonState() {
  if (!mobileActionBtn) {
    return;
  }

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Show Reset button
    mobileActionBtn.innerHTML =
      '<i class="fa-solid fa-trash-can"></i> <span>Reset Data</span>';
    mobileActionBtn.className = "mobile-action-btn mobile-action-reset";
    mobileActionBtn.title = "Reset all data";
    mobileActionBtn.setAttribute("aria-label", "Reset all data");
  } else {
    // Show Upload button
    mobileActionBtn.innerHTML =
      '<i class="fa-solid fa-upload"></i> <span>Upload Save</span>';
    mobileActionBtn.className = "mobile-action-btn mobile-action-upload";
    mobileActionBtn.title = "Upload save";
    mobileActionBtn.setAttribute("aria-label", "Upload save");
  }
}

/** Handle mobile action button click - either upload or reset based on current state */
function handleMobileActionClick(e: Event) {
  e.preventDefault();

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Reset action - ask for confirmation
    if (
      confirm("Are you sure you want to reset all data? This cannot be undone.")
    ) {
      clearAllData();
      // Close drawer after reset
      closeTabsDrawer();
    }
  } else {
    // Upload action Close drawer first
    closeTabsDrawer();
    // Open upload overlay after drawer closes
    setTimeout(() => {
      uploadOverlay.classList.remove("hidden");
      dropzone.focus();
    }, 100);
  }
}

// ==================== CONTEXT DRAWER (RIGHT) ====================

function initContextDrawer() {
  const toggleBtn = getHTMLElement("mobile-context-toggle");
  const backdrop = getHTMLElement("mobile-context-backdrop");
  const drawer = getHTMLElement("mobile-context-drawer");
  const closeBtn = drawer.querySelector("[data-drawer='context']")!;

  // Event listeners
  toggleBtn.addEventListener("click", openContextDrawer);
  closeBtn.addEventListener("click", closeContextDrawer);
  backdrop.addEventListener("click", closeContextDrawer);

  // Close TOC drawer when clicking TOC link (on mobile/tablet only)
  const tocContainer = getHTMLElement("toc");
  tocContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "A" // Small delay to allow smooth scroll (only on mobile/tablet)
      && window.innerWidth <= 1024
      && contextDrawerOpen
    ) {
      setTimeout(() => {
        closeContextDrawer();
      }, 300);
    }
  });
}

function openContextDrawer() {
  // Close tabs drawer if open
  if (tabsDrawerOpen) {
    closeTabsDrawer();
  }

  const drawer = getHTMLElement("mobile-context-drawer");
  const backdrop = getHTMLElement("mobile-context-backdrop");

  drawer.classList.add("open");
  backdrop.classList.add("active");
  contextDrawerOpen = true;

  // Prevent body scroll
  document.body.style.overflow = "hidden";
}

function closeContextDrawer() {
  const drawer = getHTMLElement("mobile-context-drawer");
  const backdrop = getHTMLElement("mobile-context-backdrop");

  drawer.classList.remove("open");
  backdrop.classList.remove("active");
  contextDrawerOpen = false;

  // Restore body scroll
  document.body.style.overflow = "";
}

export function updateContextButton(): void {
  const activeTab = getStoredActiveTab();
  const contextToggleBtn = getHTMLElement("mobile-context-toggle");
  const contextLabel = getHTMLElement("mobile-context-label");
  const contextTitle = getHTMLElement("mobile-context-title");
  const tocContainer = getHTMLElement("mobile-toc-container");
  const mapFiltersContainer = getHTMLElement("mobile-map-filters-container");

  const isMobileOrTablet = window.innerWidth <= 1024;

  if (activeTab === "allprogress") {
    // Show TOC (only on mobile/tablet, desktop has fixed TOC)
    if (isMobileOrTablet) {
      contextToggleBtn.classList.add("visible");
      contextToggleBtn.dataset.mode = "toc";
      contextToggleBtn.setAttribute("title", "Table of Contents");
      const icon = contextToggleBtn.querySelector("i");
      if (icon) {
        icon.className = "fa-solid fa-list";
      }
      contextLabel.textContent = "Contents";
      contextTitle.textContent = "Table of Contents";

      tocContainer.classList.remove("hidden");
      mapFiltersContainer.classList.add("hidden");
    } else {
      contextToggleBtn.classList.remove("visible");
    }
  } else if (activeTab === "map") {
    // Map tab: no topbar button (uses desktop-pins-toggle in map header for all screen sizes)
    contextToggleBtn.classList.remove("visible");

    tocContainer.classList.add("hidden");
    mapFiltersContainer.classList.remove("hidden");
  } else {
    // Raw Save tab - hide context button
    contextToggleBtn.classList.remove("visible");

    // Close drawer if open
    if (contextDrawerOpen) {
      closeContextDrawer();
    }
  }
}

// ==================== CLEANUP ====================

export function cleanupMobileDrawers(): void {
  // Close tabs drawer if open (context drawer stays available for map filters)
  if (tabsDrawerOpen) {
    closeTabsDrawer();
  }
}
