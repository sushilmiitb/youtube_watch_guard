/**
 * Mark Videos Not Interested - Content Script Component
 * Handles YouTube filter state detection and Not Interested automation
 */

import logger from '../logger.js';

/**
 * Get the current YouTube filter state
 * @returns {Object} - Object containing filter state information
 */
function getYouTubeFilterState() {
  try {
    // Find the filter chip bar renderer
    const filterChipBar = document.querySelector('ytd-feed-filter-chip-bar-renderer');
    
    if (!filterChipBar) {
      logger.debug('YouTube filter chip bar not found');
      return { isAll: false, error: 'Filter bar not found', text: '' };
    }
    
    // Find the active chip (the one with ytChipShapeActive class)
    const activeChip = filterChipBar.querySelector('.ytChipShapeActive');
    
    if (!activeChip) {
      logger.debug('No active filter chip found');
      return { isAll: false, error: 'No active filter found', text: '' };
    }
    
    // Get the text content of the active chip
    const chipText = activeChip.textContent?.trim() || '';
    
    logger.debug('Active filter chip text:', chipText);
    
    // Check if the text is "All" (case-insensitive)
    const isAll = chipText.toLowerCase() === 'all';
    
    return { isAll, text: chipText, error: null };
    
  } catch (error) {
    logger.error('Error checking YouTube filter state:', error);
    return { isAll: false, error: 'Error checking filter state', text: '' };
  }
}

/**
 * Set up message listener for Not Interested automation and filter state requests
 */
function setupMessageListeners() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'markNotInterested') {
        // Dynamically import and execute the action
        import(chrome.runtime.getURL('src/notInterestedActions.js')).then(module => {
          module.markVideosNotInterested(message.count || 10);
        }).catch(err => {
          logger.error('Failed to run Not Interested automation:', err);
        });
      } else if (message.action === 'getFilterState') {
        // Handle filter state requests from popup
        try {
          const filterState = getYouTubeFilterState();
          sendResponse(filterState);
        } catch (error) {
          logger.error('Error getting filter state:', error);
          sendResponse({ isAll: false, error: 'Failed to get filter state', text: '' });
        }
        return true; // Indicates we will send a response asynchronously
      }
    });
  }
}

/**
 * Initialize the Mark Videos Not Interested component
 */
export function initializeMarkVideosContent() {
  logger.info('Conscious YouTube: Mark Videos Not Interested component initializing');

  // Set up message listeners
  setupMessageListeners();

  return {
    getYouTubeFilterState
  };
}
