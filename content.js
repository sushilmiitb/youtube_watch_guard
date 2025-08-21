// Content script for YouTube video filtering
// Scans YouTube homepage and hides videos based on topic similarity

// Configuration
const DEFAULT_SENSITIVITY = 0.3; // 30% default threshold
const SCAN_INTERVAL = 5000; // Scan every 1 second
const DEBOUNCE_DELAY = 250; // Debounce DOM changes

// State management
let excludedTopics = [];
let sensitivity = DEFAULT_SENSITIVITY;
let isScanning = false;
let scanTimeout = null;
let embeddingApi = null; // Loaded on demand
let processedVideos = new WeakSet(); // Track processed video elements to avoid duplicates
let videoAction = 'hide'; // 'hide' or 'delete'
let removeShortsSection = false;
// Import the embedding similarity function
let calculateTopicSimilarity;
import logger from './src/logger.js';

async function ensureEmbeddingApi() {
  if (embeddingApi) return embeddingApi;
  
  // In extension runtime, import via chrome.runtime URL
  const url = chrome.runtime.getURL('src/embeddingUtils.js');
  if (!url) throw new Error('Embedding module URL unavailable');
  embeddingApi = await import(url);
  calculateTopicSimilarity = embeddingApi.calculateTopicSimilarity;
  return embeddingApi;
}

/**
 * Get excluded topics and sensitivity from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['topics', 'sensitivity', 'videoAction', 'removeShortsSection']);
    excludedTopics = result.topics || [];
    sensitivity = result.sensitivity || DEFAULT_SENSITIVITY;
    videoAction = result.videoAction || 'hide';
    removeShortsSection = !!result.removeShortsSection;
  } catch (error) {
    logger.error('Failed to load settings:', error);
  }
}

/**
 * Extract video title from a YouTube video tile
 * @param {Element} videoElement - The video tile element
 * @returns {string|null} - Video title or null if not found
 */
function extractVideoTitle(videoElement) {
  try {
    // Look for title in various possible selectors
    const titleSelectors = [
      'h3.yt-lockup-metadata-view-model-wiz__heading-reset',
      '#video-title',
      'a[title]',
      'h3 a',
      '.title'
    ];

    for (const selector of titleSelectors) {
      const titleElement = videoElement.querySelector(selector);
      if (titleElement) {
        const title = titleElement.getAttribute('title') || 
                     titleElement.textContent || 
                     titleElement.getAttribute('aria-label');
        if (title && title.trim()) {
          return title.trim();
        }
      }
    }
    return null;
  } catch (error) {
    logger.error('Error extracting video title:', error);
    return null;
  }
}

/**
 * Determines if a video should be hidden based on its semantic similarity to excluded topics.
 * Calls calculateTopicSimilarity for each topic and hides if any are above the threshold.
 * @param {string} videoTitle - The title of the YouTube video to evaluate.
 * @param {string[]} [topics] - An array of excluded topics to check against. Defaults to the globally loaded `excludedTopics`.
 * @param {number} [threshold] - The sensitivity threshold (0-1) for hiding. Defaults to the globally loaded `sensitivity`.
 * @returns {Promise<boolean>} - True if the video should be hidden.
 */
async function shouldHideVideo(videoTitle, topics = excludedTopics, threshold = sensitivity) {
  if (!videoTitle) {
    return false;
  }
  if (!calculateTopicSimilarity) {
    await ensureEmbeddingApi();
  }
  for (const topic of topics) {
    try {
      const similarity = await calculateTopicSimilarity(topic, videoTitle);
      logger.debug(`[ConsciousYouTube] Title: "${videoTitle}" | Topic: "${topic}" | Similarity: ${similarity}`);
      if (similarity >= threshold) {
        return true;
      }
    } catch (e) {
      logger.error('Error in similarity check:', e);
    }
  }
  return false;
}

/**
 * Hide a video element by reducing opacity and disabling interactions
 * @param {Element} videoElement - The video element to hide
 */
function hideVideo(videoElement) {
  const title = extractVideoTitle(videoElement);
  logger.debug('hideVideo called for element:', videoElement, '| Title:', title);
  if (videoElement && !videoElement.classList.contains('conscious-youtube-hidden')) {
    videoElement.classList.add('conscious-youtube-hidden');
    videoElement.style.opacity = '0.4';
    videoElement.style.pointerEvents = 'none';
    
    // Add a subtle indicator
    const indicator = document.createElement('div');
    indicator.className = 'conscious-youtube-indicator';
    indicator.textContent = 'Hidden';
    indicator.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      z-index: 1000;
    `;
    videoElement.style.position = 'relative';
    videoElement.appendChild(indicator);
  }
}

/**
 * Show a previously hidden video
 * @param {Element} videoElement - The video element to show
 */
function showVideo(videoElement) {
  if (videoElement && videoElement.classList.contains('conscious-youtube-hidden')) {
    videoElement.classList.remove('conscious-youtube-hidden');
    videoElement.style.opacity = '';
    videoElement.style.pointerEvents = '';
    
    const indicator = videoElement.querySelector('.conscious-youtube-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

/**
 * Clear the processed videos cache
 * This should be called when settings change or when navigating to a new page
 */
function clearProcessedVideosCache() {
  processedVideos = new WeakSet();
  logger.info('Conscious YouTube: Cleared processed videos cache');
}

/**
 * Delete a video element from the DOM
 * @param {Element} videoElement - The video element to delete
 */
function deleteVideo(videoElement) {
  if (videoElement && videoElement.parentNode) {
    videoElement.parentNode.removeChild(videoElement);
    logger.info('Conscious YouTube: Deleted video element');
  }
}

/**
 * Remove Shorts sections from the DOM if enabled
 */
function removeShortsSectionsFromDOM() {
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

function getVideoSelectorsForPage() {
  const url = window.location.href;
  if (/youtube\.com\/(results|search)/.test(url)) {
    // Search page
    return ['ytd-video-renderer', 'ytd-compact-video-renderer'];
  } else if (/youtube\.com\/watch/.test(url)) {
    // Watch/view page
    return ['ytm-shorts-lockup-view-model-v2', 'yt-lockup-view-model'];
  } else {
    // Homepage (default)
    return ['ytd-rich-item-renderer'];
  }
}

/**
 * Scan the page for video elements and process them
 * Only processes video elements that haven't been processed before
 */
async function scanForVideos() {
  if (isScanning) return;
  isScanning = true;

  try {
    // Remove Shorts sections if enabled
    if (removeShortsSection) {
      removeShortsSectionsFromDOM();
    }
    // Find all video containers for the current page type
    const videoSelectors = getVideoSelectorsForPage();
    let videoElements = [];
    for (const selector of videoSelectors) {
      const elements = document.querySelectorAll(selector);
      videoElements.push(...Array.from(elements));
    }

    // Process only unprocessed video elements
    let processedCount = 0;
    for (const videoElement of videoElements) {
      // Skip if already processed
      if (processedVideos.has(videoElement)) {
        continue;
      }

      const title = extractVideoTitle(videoElement);
      if (title) {
        const shouldHide = await shouldHideVideo(title);
        
        if (shouldHide) {
          if (videoAction === 'delete') {
            deleteVideo(videoElement);
          } else {
            hideVideo(videoElement);
          }
        } else {
          showVideo(videoElement);
        }
        
        // Mark as processed
        processedVideos.add(videoElement);
        processedCount++;
      }
    }

    // Log processing summary
    if (processedCount > 0) {
      logger.info(`Conscious YouTube: Processed ${processedCount} new videos`);
    }
  } catch (error) {
    logger.error('Error scanning for videos:', error);
  } finally {
    isScanning = false;
  }
}

/**
 * Debounced scan function to avoid excessive processing
 */
function debouncedScan() {
  if (scanTimeout) {
    clearTimeout(scanTimeout);
  }
  scanTimeout = setTimeout(scanForVideos, DEBOUNCE_DELAY);
}

/**
 * Initialize the content script
 */
async function initialize() {
  logger.info('Conscious YouTube: Content script initializing');

  // Ensure embedding API is available before scanning
  await ensureEmbeddingApi();
  
  // Load initial settings
  await loadSettings();
  
  // Set up storage change listener
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.topics || changes.sensitivity || changes.videoAction || changes.removeShortsSection) {
      loadSettings().then(() => {
        // Clear processed videos cache to re-evaluate with new settings
        clearProcessedVideosCache();
        logger.info('Conscious YouTube: Settings changed, clearing video cache for re-evaluation');
        // Re-scan when settings change
        debouncedScan();
      });
    }
  });

  // Set up URL change listener for page navigation
  let currentUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      clearProcessedVideosCache();
      logger.info('Conscious YouTube: Page changed, clearing video cache');
      // Small delay to let the new page load
      setTimeout(debouncedScan, 500);
    }
  });

  // Observe URL changes
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial scan
  scanForVideos();

  // Set up periodic scanning for dynamic content
  setInterval(debouncedScan, SCAN_INTERVAL);

  // Set up mutation observer for dynamic content loading
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes are video elements
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const videoSelectors = [
              'ytd-rich-item-renderer',
              'ytd-video-renderer',
              'ytd-compact-video-renderer',
              'ytd-grid-video-renderer'
            ];
            for (const selector of videoSelectors) {
              if ((node.matches && node.matches(selector)) || 
                  (node.querySelector && node.querySelector(selector))) {
                shouldScan = true;
                break;
              }
            }
          }
        }
      }
    }
    if (shouldScan) {
      debouncedScan();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
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
    extractVideoTitle, 
    shouldHideVideo, 
    hideVideo, 
    showVideo,
    clearProcessedVideosCache,
    deleteVideo
  };
}
