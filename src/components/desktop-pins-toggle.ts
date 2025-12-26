import { getHTMLElement } from "../elements.ts";

export function initDesktopPinsToggle(): void {
  const desktopPinsToggle = document.querySelector("#desktop-pins-toggle");
  if (!desktopPinsToggle) {
    return;
  }

  const contextDrawer = getHTMLElement("mobile-context-drawer");
  const contextBackdrop = getHTMLElement("mobile-context-backdrop");
  const contextTitle = getHTMLElement("mobile-context-title");
  const pinsContainer = getHTMLElement("mobile-map-filters-container");

  desktopPinsToggle.addEventListener("click", () => {
    // Toggle drawer
    const isOpen = contextDrawer.classList.contains("open");

    if (isOpen) {
      contextDrawer.classList.remove("open");
      contextBackdrop.classList.remove("active");
      document.body.style.overflow = "";
    } else {
      // Set drawer title and ensure map filters are visible
      contextTitle.textContent = "Pins";
      pinsContainer.classList.remove("hidden");

      contextDrawer.classList.add("open");
      contextBackdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  });

  // Close when clicking backdrop
  contextBackdrop.addEventListener("click", () => {
    contextDrawer.classList.remove("open");
    contextBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  });
}
