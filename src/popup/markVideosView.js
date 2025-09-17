/**
 * Mark Videos Not Interested - View Layer
 * Handles all DOM manipulation and UI rendering for the mark videos section
 */

// --- Button State Management ---
let notInterestedBtn = null;
let isOnYouTubeHomepage = false;
let isFilterSetToAll = false;

/**
 * Initialize button state management
 */
export function initializeButtonState() {
  notInterestedBtn = document.getElementById('not-interested-btn');
  return notInterestedBtn;
}

/**
 * Set tooltip text for the button
 * @param {string} text - Tooltip text
 */
export function setTooltipText(text) {
  if (!notInterestedBtn) return;
  notInterestedBtn.setAttribute('data-tip', text);
}

/**
 * Clear tooltip text
 */
export function clearTooltip() {
  if (!notInterestedBtn) return;
  notInterestedBtn.setAttribute('data-tip', '');
}

/**
 * Enable the button and remove tooltip
 */
export function setButtonEnabled() {
  if (!notInterestedBtn) return;
  isOnYouTubeHomepage = true;
  isFilterSetToAll = false;
  notInterestedBtn.disabled = false;
  notInterestedBtn.classList.remove('btn-disabled');
  notInterestedBtn.classList.remove('tooltip');
  clearTooltip();
  notInterestedBtn.style.setProperty('cursor', 'pointer', 'important');
  notInterestedBtn.style.pointerEvents = 'auto';
}

/**
 * Disable the button and add tooltip
 * @param {string} tooltipText - Text to show in tooltip
 */
export function setButtonDisabled(tooltipText) {
  if (!notInterestedBtn) return;
  notInterestedBtn.disabled = true;
  notInterestedBtn.classList.add('btn-disabled');
  notInterestedBtn.classList.add('tooltip');
  setTooltipText(tooltipText);
  notInterestedBtn.style.setProperty('cursor', 'not-allowed', 'important');
  notInterestedBtn.style.pointerEvents = 'auto';
}

/**
 * Get current button state
 */
export function getButtonState() {
  return {
    isOnYouTubeHomepage,
    isFilterSetToAll,
    isDisabled: notInterestedBtn ? notInterestedBtn.disabled : true
  };
}

/**
 * Set button state flags
 * @param {boolean} onHomepage - Whether on YouTube homepage
 * @param {boolean} filterAll - Whether filter is set to "All"
 */
export function setButtonStateFlags(onHomepage, filterAll) {
  isOnYouTubeHomepage = onHomepage;
  isFilterSetToAll = filterAll;
}

/**
 * Set up button click listener
 * @param {Function} onClick - Callback for button click
 */
export function setupButtonClickListener(onClick) {
  if (notInterestedBtn) {
    notInterestedBtn.addEventListener('click', onClick);
  }
}
