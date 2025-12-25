import { getHTMLInputElement } from "../elements.ts";
import { renderActiveTab } from "../render-tab.ts";

const LOCAL_STORAGE_KEY = "showProgressOnly";

export const showProgressOnly = getHTMLInputElement("show-progress-only");

export function initShowProgressOnly(): void {
  showProgressOnly.addEventListener("change", onChange);

  // Restore the previous state of the checkbox from `localStorage`.
  showProgressOnly.checked = localStorage.getItem(LOCAL_STORAGE_KEY) === "true";
}

function onChange() {
  localStorage.setItem(LOCAL_STORAGE_KEY, showProgressOnly.checked.toString());
  renderActiveTab();
}
