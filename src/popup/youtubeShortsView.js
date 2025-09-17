/**
 * YouTube Shorts - View Layer
 * Handles all DOM manipulation and UI rendering for the YouTube Shorts section
 */

/**
 * Set Shorts section removal checkbox
 * @param {boolean} enabled - Whether to remove Shorts sections
 */
export function setRemoveShortsSection(enabled) {
  const shortsCheckbox = document.getElementById('remove-shorts-section');
  if (shortsCheckbox) {
    shortsCheckbox.checked = enabled;
  }
}

/**
 * Set up Shorts section removal listener
 * @param {Function} onChange - Callback for checkbox change
 */
export function setupShortsRemovalListener(onChange) {
  const shortsCheckbox = document.getElementById('remove-shorts-section');
  if (shortsCheckbox) {
    shortsCheckbox.addEventListener('change', onChange);
  }
}
