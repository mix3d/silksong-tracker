import { getHTMLElement, uploadOverlay, dropzone } from "../elements.ts";
import { getStoredActiveTab } from "./sidebar-items.ts";
import { getSaveData, clearAllData } from "../save-data.ts";
import type { Tab } from "../render-tab.ts";

let tabsDrawerOpen = false;
let contextDrawerOpen = false;

export function initMobileDrawers(): void {
  // Only init tabs drawer on mobile/tablet
  const isMobileOrTablet = window.innerWidth <= 1024;
  if (isMobileOrTablet) {
    initTabsDrawer();
    initMobileActionButton();
  }

  // Always init context drawer (needed for map filters on all screen sizes)
  initContextDrawer();
  updateContextButton();
}

// ==================== TABS DRAWER (LEFT) ====================

function initTabsDrawer(): void {
  const toggleBtn = getHTMLElement("mobile-tabs-toggle");
  const drawer = getHTMLElement("mobile-tabs-drawer");
  const backdrop = getHTMLElement("mobile-tabs-backdrop");
  const closeBtn = drawer.querySelector("[data-drawer='tabs']") as HTMLButtonElement;
  
  // Clone sidebar items into mobile drawer
  const mobileTabItemsContainer = getHTMLElement("mobile-tab-items");
  const desktopSidebarItems = document.querySelectorAll(".sidebar-item");
  
  for (const item of desktopSidebarItems) {
    const clone = item.cloneNode(true) as HTMLAnchorElement;

    // Sync active state
    if (item.classList.contains("is-active")) {
      clone.classList.add("is-active");
    }

    // Wire up click to trigger the original desktop item's click (which has navigation logic)
    clone.addEventListener("click", (e) => {
      e.preventDefault();

      // Trigger click on the original desktop sidebar item (has the navigation logic)
      const originalItem = item as HTMLAnchorElement;
      originalItem.click();

      // Close drawer
      closeTabsDrawer();
    });

    mobileTabItemsContainer.append(clone);
  }
  
  // Clone external links
  const mobileExternalLinksContainer = getHTMLElement("mobile-external-links");
  const desktopSidebarLinks = document.querySelector(".sidebar-links");
  const desktopSidebarActions = document.querySelector(".sidebar-actions");
  
  if (desktopSidebarLinks) {
    const linksClone = desktopSidebarLinks.cloneNode(true);
    mobileExternalLinksContainer.append(linksClone);
  }
  
  if (desktopSidebarActions) {
    const actionsClone = desktopSidebarActions.cloneNode(true);
    mobileExternalLinksContainer.append(actionsClone);
  }
  
  // Event listeners
  toggleBtn.addEventListener("click", openTabsDrawer);
  closeBtn.addEventListener("click", closeTabsDrawer);
  backdrop.addEventListener("click", closeTabsDrawer);
  
  // Sync active state with desktop
  observeSidebarActiveState();
}

function openTabsDrawer(): void {
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

function closeTabsDrawer(): void {
  const drawer = getHTMLElement("mobile-tabs-drawer");
  const backdrop = getHTMLElement("mobile-tabs-backdrop");
  
  drawer.classList.remove("open");
  backdrop.classList.remove("active");
  tabsDrawerOpen = false;
  
  // Restore body scroll
  document.body.style.overflow = "";
}

function observeSidebarActiveState(): void {
  // Sync desktop sidebar active state to mobile
  const observer = new MutationObserver(() => {
    const desktopActiveItem = document.querySelector(".sidebar .sidebar-item.is-active");
    const mobileItems = document.querySelectorAll(".mobile-tab-items .sidebar-item");
    
    for (const mobileItem of mobileItems) {
      mobileItem.classList.remove("is-active");
      
      if (desktopActiveItem && 
          mobileItem.getAttribute("data-tab") === desktopActiveItem.getAttribute("data-tab")) {
        mobileItem.classList.add("is-active");
      }
    }
    
    // Update context button when tab changes
    updateContextButton();
  });
  
  const desktopSidebarItems = document.querySelectorAll(".sidebar .sidebar-item");
  for (const item of desktopSidebarItems) {
    observer.observe(item, { attributes: true, attributeFilter: ["class"] });
  }
}

// ==================== MOBILE ACTION BUTTON (UPLOAD/RESET TOGGLE) ====================

let mobileActionBtn: HTMLButtonElement | null = null;

/**
 * Initialize the mobile drawer action button with Upload/Reset toggle logic
 */
function initMobileActionButton(): void {
  try {
    mobileActionBtn = document.getElementById("mobile-data-action-btn") as HTMLButtonElement;

    if (!mobileActionBtn) {
      return;
    }

    // Set initial state
    updateMobileActionButtonState();

    // Add click handler
    mobileActionBtn.addEventListener("click", handleMobileActionClick);

    // Listen for data changes to update button state
    globalThis.addEventListener("save-data-changed", updateMobileActionButtonState);
  } catch (error) {
    console.warn("Mobile action button not found:", error);
  }
}

/**
 * Update the mobile button to show Upload or Reset based on data state
 */
function updateMobileActionButtonState(): void {
  if (!mobileActionBtn) return;

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Show Reset button
    mobileActionBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> <span>Reset Data</span>';
    mobileActionBtn.className = "mobile-action-btn mobile-action-reset";
    mobileActionBtn.title = "Reset all data";
    mobileActionBtn.setAttribute("aria-label", "Reset all data");
  } else {
    // Show Upload button
    mobileActionBtn.innerHTML = '<i class="fa-solid fa-upload"></i> <span>Upload Save</span>';
    mobileActionBtn.className = "mobile-action-btn mobile-action-upload";
    mobileActionBtn.title = "Upload save";
    mobileActionBtn.setAttribute("aria-label", "Upload save");
  }
}

/**
 * Handle mobile action button click - either upload or reset based on current state
 */
function handleMobileActionClick(e: Event): void {
  e.preventDefault();

  const hasData = getSaveData() !== undefined;

  if (hasData) {
    // Reset action - ask for confirmation
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      clearAllData();
      // Close drawer after reset
      closeTabsDrawer();
    }
  } else {
    // Upload action
    // Close drawer first
    closeTabsDrawer();
    // Open upload overlay after drawer closes
    setTimeout(() => {
      uploadOverlay.classList.remove("hidden");
      dropzone.focus();
    }, 100);
  }
}

// ==================== CONTEXT DRAWER (RIGHT) ====================

function initContextDrawer(): void {
  const toggleBtn = getHTMLElement("mobile-context-toggle");
  const drawer = getHTMLElement("mobile-context-drawer");
  const backdrop = getHTMLElement("mobile-context-backdrop");
  const closeBtn = drawer.querySelector("[data-drawer='context']") as HTMLButtonElement;
  
  // Move TOC and Map Filters into mobile drawer
  moveContentToMobileDrawer();
  
  // Event listeners
  toggleBtn.addEventListener("click", openContextDrawer);
  closeBtn.addEventListener("click", closeContextDrawer);
  backdrop.addEventListener("click", closeContextDrawer);
  
  // Close drawer when clicking TOC link
  const tocContainer = getHTMLElement("mobile-toc-container");
  tocContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A") {
      // Small delay to allow smooth scroll (only on mobile/tablet)
      if (window.innerWidth <= 1024) {
        setTimeout(() => {
          closeContextDrawer();
        }, 300);
      }
    }
  });
}

function openContextDrawer(): void {
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

function closeContextDrawer(): void {
  const drawer = getHTMLElement("mobile-context-drawer");
  const backdrop = getHTMLElement("mobile-context-backdrop");
  
  drawer.classList.remove("open");
  backdrop.classList.remove("active");
  contextDrawerOpen = false;
  
  // Restore body scroll
  document.body.style.overflow = "";
}

function moveContentToMobileDrawer(): void {
  // Move TOC into mobile container
  const desktopTocList = getHTMLElement("toc-list");
  const mobileTocContainer = getHTMLElement("mobile-toc-container");
  mobileTocContainer.append(desktopTocList);
  
  // Move TOC legend if it exists
  const desktopTocContainer = getHTMLElement("toc");
  const tocLegend = desktopTocContainer.querySelector(".toc-legend");
  if (tocLegend) {
    mobileTocContainer.append(tocLegend);
  }
  
  // Move Map Filters into mobile container
  const mobileMapFiltersContainer = getHTMLElement("mobile-map-filters-container");
  const desktopMapSidebar = document.querySelector(".map-sidebar");
  
  if (desktopMapSidebar) {
    // Clone search box (we'll use the same ID, visibility handled by CSS)
    const mapSearch = desktopMapSidebar.querySelector(".search-container");
    if (mapSearch) {
      const searchClone = mapSearch.cloneNode(true) as HTMLElement;
      mobileMapFiltersContainer.append(searchClone);
    }
    
    // Clone filter controls (Show All / Hide All)
    const filterControls = desktopMapSidebar.querySelector(".filter-controls");
    if (filterControls) {
      const controlsClone = filterControls.cloneNode(true) as HTMLElement;
      mobileMapFiltersContainer.append(controlsClone);
      
      // Re-wire the cloned buttons
      const showAllBtn = controlsClone.querySelector("#show-all-filters");
      const hideAllBtn = controlsClone.querySelector("#hide-all-filters");
      
      if (showAllBtn && hideAllBtn) {
        // Remove IDs to avoid conflicts
        showAllBtn.removeAttribute("id");
        hideAllBtn.removeAttribute("id");
        
        // Add event listeners
        showAllBtn.addEventListener("click", () => {
          const mapFilters = document.getElementById("map-filters");
          if (mapFilters) {
            const checkboxes = mapFilters.querySelectorAll("input[type='checkbox']");
            for (const checkbox of checkboxes) {
              (checkbox as HTMLInputElement).checked = true;
            }
            // Trigger change event to update pins
            const firstCheckbox = checkboxes[0] as HTMLInputElement;
            if (firstCheckbox) {
              firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        });
        
        hideAllBtn.addEventListener("click", () => {
          const mapFilters = document.getElementById("map-filters");
          if (mapFilters) {
            const checkboxes = mapFilters.querySelectorAll("input[type='checkbox']");
            for (const checkbox of checkboxes) {
              (checkbox as HTMLInputElement).checked = false;
            }
            // Trigger change event to update pins
            const firstCheckbox = checkboxes[0] as HTMLInputElement;
            if (firstCheckbox) {
              firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        });
      }
    }
    
    // Move filter list (checkboxes will be generated here by existing code)
    const mapFilters = document.getElementById("map-filters");
    if (mapFilters) {
      mobileMapFiltersContainer.append(mapFilters);
    }
  }
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
      contextToggleBtn.setAttribute("data-mode", "toc");
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
  // Move TOC back to desktop container (only on resize to desktop)
  const desktopTocContainer = getHTMLElement("toc");
  const mobileTocContainer = getHTMLElement("mobile-toc-container");
  const tocList = getHTMLElement("toc-list");
  const tocLegend = mobileTocContainer.querySelector(".toc-legend");

  if (mobileTocContainer.contains(tocList)) {
    desktopTocContainer.append(tocList);
  }

  if (tocLegend) {
    desktopTocContainer.append(tocLegend);
  }

  // Map filters stay in drawer on all screen sizes (no need to move back)

  // Close tabs drawer if open (context drawer stays available for map filters)
  if (tabsDrawerOpen) closeTabsDrawer();
}
