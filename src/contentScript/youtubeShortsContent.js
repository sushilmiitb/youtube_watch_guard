/**
 * YouTube Shorts - Content Script Component
 * Handles removal of YouTube Shorts sections from the feed
 */

import logger from '../logger.js';

// State management
let removeShortsSection = false;

/**
 * Load Shorts section removal setting from storage
 */
async function loadShortsSettings() {
  try {
    const result = await chrome.storage.local.get(['removeShortsSection']);
    removeShortsSection = !!result.removeShortsSection;
  } catch (error) {
    logger.error('Failed to load Shorts section removal setting:', error);
  }
}

/**
 * Remove Shorts sections from the DOM if enabled
 */
function removeShortsSectionsFromDOM() {
  if (!removeShortsSection) return;
  
  const selectors = [
    'ytd-rich-section-renderer',
    'ytd-reel-shelf-renderer'
  ];
  let removedCount = 0;
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
        removedCount++;
      }
    });
  }
  if (removedCount > 0) {
    logger.info(`Conscious YouTube: Removed ${removedCount} Shorts section(s)`);
  }
}

/**
 * Set up storage change listener for Shorts section removal
 */
function setupShortsStorageListener() {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.removeShortsSection) {
      loadShortsSettings().then(() => {
        logger.info('Conscious YouTube: Shorts section removal setting changed');
        // Re-scan to apply new setting
        removeShortsSectionsFromDOM();
      });
    }
  });
}

/**
 * Initialize the YouTube Shorts component
 */
export async function initializeYouTubeShortsContent() {
  logger.info('Conscious YouTube: YouTube Shorts component initializing');

  // Load initial settings
  await loadShortsSettings();
  
  // Set up storage change listener
  setupShortsStorageListener();

  // Initial removal if enabled
  removeShortsSectionsFromDOM();

  return {
    removeShortsSectionsFromDOM
  };
}
