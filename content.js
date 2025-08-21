// Content script for YouTube video filtering
// Scans YouTube homepage and hides videos based on topic similarity

// Configuration
const DEFAULT_SENSITIVITY = 0.3; // 30% default threshold
const SCAN_INTERVAL = 1000; // Scan every 1 second
const DEBOUNCE_DELAY = 250; // Debounce DOM changes

// State management
let excludedTopics = [];
let sensitivity = DEFAULT_SENSITIVITY;
let isScanning = false;
let scanTimeout = null;
let embeddingApi = null; // Loaded on demand
let processedVideos = new WeakSet(); // Track processed video elements to avoid duplicates
// Import the embedding similarity function
let calculateTopicSimilarity;

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
    const result = await chrome.storage.local.get(['topics', 'sensitivity']);
    excludedTopics = result.topics || [];
    sensitivity = result.sensitivity || DEFAULT_SENSITIVITY;
  } catch (error) {
    console.error('Failed to load settings:', error);
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
    console.error('Error extracting video title:', error);
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
      // console.log(`[ConsciousYouTube] Title: "${videoTitle}" | Topic: "${topic}" | Similarity: ${similarity}`);
      if (similarity >= threshold) {
        return true;
      }
    } catch (e) {
      console.error('Error in similarity check:', e);
    }
  }
  return false;
}

/**
 * Hide a video element by reducing opacity and disabling interactions
 * @param {Element} videoElement - The video element to hide
 */
function hideVideo(videoElement) {
  if (videoElement && !videoElement.classList.contains('conscious-youtube-hidden')) {
    videoElement.classList.add('conscious-youtube-hidden');
    videoElement.style.opacity = '0.25';
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
  console.info('Conscious YouTube: Cleared processed videos cache');
}

/**
 * Scan the page for video elements and process them
 * Only processes video elements that haven't been processed before
 */
async function scanForVideos() {
  if (isScanning) return;
  isScanning = true;

  try {
    // Find all video containers
    const videoSelectors = [
      'ytd-rich-item-renderer', //Long form videos and shorts on homepage/feed
      'ytd-video-renderer', // Long form video results in search
      'ytd-compact-video-renderer', //Some type of videos in the search results
      'ytm-shorts-lockup-view-model', //Shorts on the search results and view page
      'yt-lockup-view-model', // Long form videos on the view page
    ];

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
          hideVideo(videoElement);
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
      console.info(`Conscious YouTube: Processed ${processedCount} new videos`);
    }
  } catch (error) {
    console.error('Error scanning for videos:', error);
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
  console.info('Conscious YouTube: Content script initializing');

  // Ensure embedding API is available before scanning
  await ensureEmbeddingApi();
  
  // Load initial settings
  await loadSettings();
  
  // Set up storage change listener
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.topics || changes.sensitivity) {
      loadSettings().then(() => {
        // Clear processed videos cache to re-evaluate with new settings
        clearProcessedVideosCache();
        console.info('Conscious YouTube: Settings changed, clearing video cache for re-evaluation');
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
      console.info('Conscious YouTube: Page changed, clearing video cache');
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
      initialize().catch((e) => console.error(e));
    });
  } else {
    initialize().catch((e) => console.error(e));
  }
}

// Export functions for testing (only when module system is available)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    extractVideoTitle, 
    shouldHideVideo, 
    hideVideo, 
    showVideo,
    clearProcessedVideosCache
  };
}
