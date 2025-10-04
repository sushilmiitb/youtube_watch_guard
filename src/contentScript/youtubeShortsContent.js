/**
 * YouTube Shorts - Content Script Component
 * Handles removal of YouTube Shorts sections from the feed
 */

import logger from '../logger.js';
import { createSharedMutationObserver } from './mutationObserverUtils.js';

// State management
let removeShortsSection = true;
let hiddenElements = new WeakSet(); // Track elements we've hidden

/**
 * Load Shorts section removal setting from storage
 */
async function loadShortsSettings() {
  try {
    const result = await chrome.storage.local.get(['removeShortsSection']);
    removeShortsSection = result.removeShortsSection !== undefined ? !!result.removeShortsSection : true;
  } catch (error) {
    logger.error('Failed to load Shorts section removal setting:', error);
  }
}

/**
 * Show previously hidden Shorts sections
 */
function showShortsSectionsFromDOM() {
  logger.debug('showShortsSectionsFromDOM called');
  
  const selectors = [
    'ytd-rich-section-renderer',
    'ytd-reel-shelf-renderer'
  ];
  let shownCount = 0;
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    logger.debug(`Found ${elements.length} elements for selector: ${selector}`);
    elements.forEach(el => {
      if (hiddenElements.has(el)) {
        el.style.display = '';
        hiddenElements.delete(el);
        shownCount++;
      }
    });
  }
  if (shownCount > 0) {
    logger.info(`Showed ${shownCount} Shorts section(s)`);
  } else {
    logger.debug('No previously hidden Shorts sections found to show');
  }
}

/**
 * Remove or show Shorts sections from the DOM based on setting
 */
function removeShortsSectionsFromDOM() {
  logger.debug(`removeShortsSectionsFromDOM called, removeShortsSection: ${removeShortsSection}`);
  
  if (removeShortsSection) {
    // Hide Shorts sections
    const selectors = [
      'ytd-rich-section-renderer',
      'ytd-reel-shelf-renderer'
    ];
    let removedCount = 0;
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      logger.debug(`Found ${elements.length} elements for selector: ${selector}`);
      elements.forEach(el => {
        if (el.style.display !== 'none') {
          el.style.display = 'none';
          hiddenElements.add(el);
          removedCount++;
        }
      });
    }
    if (removedCount > 0) {
      logger.info(`Removed ${removedCount} Shorts section(s)`);
    } else {
      logger.debug('No Shorts sections found to remove');
    }
  } else {
    // Show previously hidden Shorts sections
    showShortsSectionsFromDOM();
  }
}

/**
 * Set up storage change listener for Shorts section removal
 */
function setupShortsStorageListener() {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.removeShortsSection) {
      loadShortsSettings().then(() => {
        logger.info(`Shorts section removal setting changed to: ${removeShortsSection}`);
        // Apply new setting (hide or show based on new value)
        removeShortsSectionsFromDOM();
      });
    }
  });
}

/**
 * Debounced function to avoid excessive processing
 */
let removalTimeout = null;
function debouncedShortsAction() {
  if (removalTimeout) {
    clearTimeout(removalTimeout);
  }
  removalTimeout = setTimeout(removeShortsSectionsFromDOM, 250); // 250ms debounce
}

/**
 * Initialize the YouTube Shorts component
 */
export async function initializeYouTubeShortsContent() {
  logger.info('YouTube Shorts component initializing');

  // Load initial settings
  await loadShortsSettings();
  logger.info(`Shorts removal enabled: ${removeShortsSection}`);
  
  // Set up storage change listener
  setupShortsStorageListener();

  // Initial removal if enabled
  removeShortsSectionsFromDOM();
  
  // Also try again after a short delay in case the page is still loading
  setTimeout(() => {
    removeShortsSectionsFromDOM();
  }, 1000);

  // Set up mutation observer for dynamic content loading
  const shortsSelectors = [
    'ytd-rich-section-renderer',
    'ytd-reel-shelf-renderer'
  ];
  
  const observer = createSharedMutationObserver(shortsSelectors, debouncedShortsAction, 250);
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return {
    removeShortsSectionsFromDOM,
    showShortsSectionsFromDOM,
    debouncedShortsAction
  };
}
