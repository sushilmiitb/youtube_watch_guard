/**
 * Hide Unwanted Videos - Content Script Component
 * Handles video filtering based on topic classification
 */

import logger from '../logger.js';
import { createSharedMutationObserver } from './mutationObserverUtils.js';

// Configuration
const SCAN_INTERVAL = 5000; // Scan every 5 seconds
const DEBOUNCE_DELAY = 250; // Debounce DOM changes

// State management
let excludedTopics = [];
let isScanning = false;
let scanTimeout = null;
let classificationApi = null; // Loaded on demand
let processedVideos = new WeakSet(); // Track processed video elements to avoid duplicates
let videoAction = 'delete'; // 'hide' or 'delete'

// Import the classification functions
let batchClassifyVideoContexts;

/**
 * Ensure classification API is loaded
 */
async function ensureClassificationApi() {
  if (classificationApi) return classificationApi;
  
  // In extension runtime, import via chrome.runtime URL
  const url = chrome.runtime.getURL('src/classificationUtils.js');
  if (!url) throw new Error('Classification module URL unavailable');
  classificationApi = await import(url);
  batchClassifyVideoContexts = classificationApi.batchClassifyVideoContexts;
  return classificationApi;
}

/**
 * Get excluded topics and video action from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['topics', 'videoAction']);
    excludedTopics = result.topics || [];
    videoAction = result.videoAction || 'delete';
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
 * Extract channel name from a YouTube video tile
 * @param {Element} videoElement - The video tile element
 * @returns {string|null} - Channel name or null if not found
 */
function extractChannelName(videoElement) {
  try {
    // Look for channel name in various possible selectors
    const channelSelectors = [
      'ytd-channel-name a',
      '.ytd-channel-name a',
      'a[href*="/channel/"]',
      'a[href*="/@"]',
      '.ytd-video-meta-block a',
      '.ytd-video-meta-block yt-formatted-string',
      '.ytd-channel-name yt-formatted-string',
      '.ytd-video-meta-block .ytd-channel-name',
      'ytd-video-meta-block ytd-channel-name a',
      'ytd-video-meta-block ytd-channel-name yt-formatted-string'
    ];

    for (const selector of channelSelectors) {
      const channelElement = videoElement.querySelector(selector);
      if (channelElement) {
        const channelName = channelElement.textContent || 
                           channelElement.getAttribute('title') ||
                           channelElement.getAttribute('aria-label');
        if (channelName && channelName.trim()) {
          return channelName.trim();
        }
      }
    }
    return null;
  } catch (error) {
    logger.error('Error extracting channel name:', error);
    return null;
  }
}

/**
 * Extract combined video context (title + channel name) for better classification accuracy
 * @param {Element} videoElement - The video tile element
 * @returns {string|null} - Combined video context or null if neither found
 */
function extractVideoContext(videoElement) {
  try {
    const title = extractVideoTitle(videoElement);
    const channelName = extractChannelName(videoElement);
    
    if (!title && !channelName) {
      return null;
    }
    
    if (title && channelName) {
      return `${title} - ${channelName}`;
    } else if (title) {
      return title;
    } else {
      return channelName;
    }
  } catch (error) {
    logger.error('Error extracting video context:', error);
    return null;
  }
}


/**
 * Hide a video element by reducing opacity and disabling interactions
 * @param {Element} videoElement - The video element to hide
 */
function hideVideo(videoElement) {
  const context = extractVideoContext(videoElement);
  if (videoElement && !videoElement.classList.contains('conscious-youtube-hidden')) {
    
    videoElement.classList.add('conscious-youtube-hidden');
    videoElement.style.opacity = '0.4';
    videoElement.style.pointerEvents = 'none';
    // Add the indicator
    const indicator = document.createElement('div');
    indicator.className = 'conscious-youtube-indicator';
    indicator.textContent = 'Hidden';
    indicator.style.cssText = `
      position: absolute;
      top: 5px;
      left: 5px;
      background: rgba(255, 0, 0, 1.0);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      z-index: 1000;
      pointer-events: none;
    `;
    videoElement.style.position = 'relative';
    videoElement.appendChild(indicator);
  }
  // Show the video if it's currently hidden with display: none
  if (videoElement && videoElement.style.display === 'none') {
    videoElement.style.removeProperty('display');
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
    // Remove indicator
    const indicator = videoElement.querySelector('.conscious-youtube-indicator');
    if (indicator) indicator.remove();
  }
  // Show the video if it's currently hidden with display: none
  if (videoElement && videoElement.style.display === 'none') {
    videoElement.style.removeProperty('display');
  }
}

/**
 * Clear the processed videos cache
 */
function clearProcessedVideosCache() {
  processedVideos = new WeakSet();
  logger.info('Cleared processed videos cache');
}

/**
 * Delete a video element from the DOM
 * @param {Element} videoElement - The video element to delete
 */
function deleteVideo(videoElement) {
  if (videoElement && videoElement.parentNode) {
    videoElement.style.display = 'none';
    logger.info('Hidden video element');
  }
}

/**
 * Get video selectors for the current page type
 */
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
 * Initialize classification API
 */
async function initializeClassificationApi() {
  if (!classificationApi) {
    await ensureClassificationApi();
    logger.info('Classification API initialized.');
  }
}

/**
 * Scan the page for video elements and process them
 */
async function scanForVideos() {
  logger.debug('scanForVideos called');
  if (isScanning) return;
  isScanning = true;

  try {
    // Find all video containers for the current page type
    const videoSelectors = getVideoSelectorsForPage();
    let videoElements = [];
    for (const selector of videoSelectors) {
      const elements = document.querySelectorAll(selector);
      videoElements.push(...Array.from(elements));
    }
    logger.debug('videoElements:', videoElements);
    // Collect unprocessed video elements and their contexts
    let unprocessed = [];
    for (const videoElement of videoElements) {
      if (processedVideos.has(videoElement)) continue;
      const context = extractVideoContext(videoElement);
      if (context) {
        unprocessed.push({ videoElement, context });
      }
    }

    if (unprocessed.length > 0 && excludedTopics.length > 0) {
      logger.debug(`📋 Collected ${unprocessed.length} unprocessed videos:`);
      logger.debug('unprocessed:', unprocessed);
      
      if (!classificationApi) await ensureClassificationApi();
      const contexts = unprocessed.map(item => item.context);
      let hideDecisions = [];
      
      try {
        // Batch classify all video contexts
        logger.debug('contexts:', contexts);
        hideDecisions = await batchClassifyVideoContexts(contexts, excludedTopics);
        logger.debug('hideDecisions:', hideDecisions);
      } catch (error) {
        logger.error('Batch classification API failed:', error);
        // Mark as processed to avoid retry loop
        for (const { videoElement } of unprocessed) {
          processedVideos.add(videoElement);
        }
        isScanning = false;
        return;
      }
      
      // Apply hide/show decisions based on classification results
      for (let i = 0; i < unprocessed.length; i++) {
        const { videoElement, context } = unprocessed[i];
        const shouldHide = hideDecisions[i];
        
        logger.debug(`🎬 Video ${i}: Context="${context}" → Decision=${shouldHide ? 'HIDE' : 'SHOW'}`, { index: i, videoElement });
        
        if (shouldHide) {
          if (videoAction === 'delete') {
            deleteVideo(videoElement);
          } else {
            hideVideo(videoElement);
          }
        } else {
          showVideo(videoElement);
        }
        processedVideos.add(videoElement);
      }
      logger.info(`Processed ${unprocessed.length} new videos (classification batch)`);
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
 * Initialize the Hide Unwanted Videos component
 */
export async function initializeHideUnwantedContent() {
  logger.info('Hide Unwanted Videos component initializing');

  // Ensure classification API is available before scanning
  await ensureClassificationApi();
  
  // Load initial settings
  await loadSettings();
  await initializeClassificationApi();
  
  // Set up storage change listener
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.topics || changes.videoAction) {
      loadSettings().then(async () => {
        // Clear processed videos cache to re-evaluate with new settings
        clearProcessedVideosCache();
        logger.info('Settings changed, clearing video cache for re-evaluation');
        // Re-scan when settings change
        debouncedScan();
      });
    }
  });
  logger.debug('Storage change listener set up');

  // Initial scan
  scanForVideos();

  logger.debug('Initial scan completed');

  // Set up periodic scanning for dynamic content
  setInterval(debouncedScan, SCAN_INTERVAL);

  // Set up mutation observer for dynamic content loading
  const videoSelectors = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer'
  ];
  
  const observer = createSharedMutationObserver(videoSelectors, debouncedScan, 250);
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return {
    scanForVideos,
    clearProcessedVideosCache,
    extractVideoTitle,
    extractChannelName,
    extractVideoContext,
    hideVideo,
    showVideo,
    deleteVideo
  };
}

// Export individual functions for testing
export {
  extractVideoTitle,
  extractChannelName,
  extractVideoContext,
  hideVideo,
  showVideo,
  deleteVideo,
  clearProcessedVideosCache
};
