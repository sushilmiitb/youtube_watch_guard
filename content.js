/**
 * Content Script Main Entry Point
 * Handles component wiring and initialization
 */

import { initializeHideUnwantedContent } from './src/contentScript/hideUnwantedContent.js';
import { initializeMarkVideosContent } from './src/contentScript/markVideosContent.js';
import { initializeYouTubeShortsContent } from './src/contentScript/youtubeShortsContent.js';
import logger from './src/logger.js';

// Component instances
let hideUnwantedComponent = null;
let markVideosComponent = null;
let youtubeShortsComponent = null;


/**
 * Initialize all content script components
 */
async function initialize() {
  logger.info('Conscious YouTube: Content script initializing');

  try {
    // Initialize all components
    hideUnwantedComponent = await initializeHideUnwantedContent();
    markVideosComponent = initializeMarkVideosContent();
    youtubeShortsComponent = await initializeYouTubeShortsContent();

  // Set up URL change listener for page navigation
  let currentUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
        // Clear processed videos cache when page changes
        if (hideUnwantedComponent && hideUnwantedComponent.clearProcessedVideosCache) {
          hideUnwantedComponent.clearProcessedVideosCache();
        }
      logger.info('Conscious YouTube: Page changed, clearing video cache');
      // Small delay to let the new page load
        setTimeout(() => {
          if (hideUnwantedComponent && hideUnwantedComponent.scanForVideos) {
            hideUnwantedComponent.scanForVideos();
          }
        }, 500);
    }
  });

  // Observe URL changes
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

    logger.info('All content script components initialized successfully');
    
    // Return component instances for potential external access
    return {
      hideUnwanted: hideUnwantedComponent,
      markVideos: markVideosComponent,
      youtubeShorts: youtubeShortsComponent
    };
  } catch (error) {
    logger.error('Failed to initialize content script components:', error);
  }
}

// Initialize when DOM is ready (only in extension runtime)
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize().catch((e) => logger.error(e));
    });
  } else {
    initialize().catch((e) => logger.error(e));
  }
}

// Export functions for testing (only when module system is available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    initialize,
    hideUnwantedComponent,
    markVideosComponent,
    youtubeShortsComponent
  };
}