/**
 * Hide Unwanted Videos - Content Script Component
 * Handles video filtering based on topic similarity
 */

import logger from '../logger.js';

// Configuration
const DEFAULT_SENSITIVITY = 0.3; // 30% default threshold
const SCAN_INTERVAL = 5000; // Scan every 5 seconds
const DEBOUNCE_DELAY = 250; // Debounce DOM changes

// State management
let excludedTopics = [];
let sensitivity = DEFAULT_SENSITIVITY;
let isScanning = false;
let scanTimeout = null;
let embeddingApi = null; // Loaded on demand
let processedVideos = new WeakSet(); // Track processed video elements to avoid duplicates
let videoAction = 'hide'; // 'hide' or 'delete'
let topicEmbeddings = [];

// Import the embedding similarity function
let calculateTopicSimilarity;

/**
 * Ensure embedding API is loaded
 */
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
    const result = await chrome.storage.local.get(['topics', 'sensitivity', 'videoAction']);
    excludedTopics = result.topics || [];
    sensitivity = result.sensitivity || DEFAULT_SENSITIVITY;
    videoAction = result.videoAction || 'hide';
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
 * @param {string} videoTitle - The title of the YouTube video to evaluate.
 * @param {string[]} [topics] - An array of excluded topics to check against.
 * @param {number} [threshold] - The sensitivity threshold (0-1) for hiding.
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
}

/**
 * Clear the processed videos cache
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
 * Fetch and store embeddings for all excluded topics
 */
async function updateTopicEmbeddings() {
  if (!embeddingApi) await ensureEmbeddingApi();
  const { getBatchEmbeddings } = embeddingApi;
  if (excludedTopics.length > 0) {
    try {
      topicEmbeddings = await getBatchEmbeddings(excludedTopics);
      logger.info('Fetched topic embeddings for current topics.');
    } catch (error) {
      logger.error('Failed to fetch topic embeddings:', error);
      topicEmbeddings = [];
    }
  } else {
    topicEmbeddings = [];
  }
}

/**
 * Scan the page for video elements and process them
 */
async function scanForVideos() {
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

    // Collect unprocessed video elements and their titles
    let unprocessed = [];
    for (const videoElement of videoElements) {
      if (processedVideos.has(videoElement)) continue;
      const title = extractVideoTitle(videoElement);
      if (title) {
        unprocessed.push({ videoElement, title });
      }
    }

    if (unprocessed.length > 0 && excludedTopics.length > 0 && topicEmbeddings.length === excludedTopics.length) {
      if (!embeddingApi) await ensureEmbeddingApi();
      const { getBatchEmbeddings, cosineSimilarity } = embeddingApi;
      const titles = unprocessed.map(item => item.title);
      let videoEmbeddings = [];
      try {
        // Batch fetch embeddings for all video titles
        videoEmbeddings = await getBatchEmbeddings(titles);
      } catch (error) {
        logger.error('Batch embedding API failed:', error);
        // Mark as processed to avoid retry loop
        for (const { videoElement } of unprocessed) {
          processedVideos.add(videoElement);
        }
        isScanning = false;
        return;
      }
      // For each video, check similarity with each topic embedding
      for (let i = 0; i < unprocessed.length; i++) {
        const { videoElement, title } = unprocessed[i];
        const videoEmbedding = videoEmbeddings[i];
        let shouldHide = false;
        for (let t = 0; t < excludedTopics.length; t++) {
          const topic = excludedTopics[t];
          const topicEmbedding = topicEmbeddings[t];
          try {
            const similarity = cosineSimilarity(topicEmbedding, videoEmbedding);
            logger.debug(`[ConsciousYouTube] Title: "${title}" | Topic: "${topic}" | Similarity: ${similarity}`);
            if (similarity >= sensitivity) {
              shouldHide = true;
              break;
            }
          } catch (e) {
            logger.error('Error in similarity check:', e);
          }
        }
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
      logger.info(`Conscious YouTube: Processed ${unprocessed.length} new videos (batched)`);
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
  logger.info('Conscious YouTube: Hide Unwanted Videos component initializing');

  // Ensure embedding API is available before scanning
  await ensureEmbeddingApi();
  
  // Load initial settings
  await loadSettings();
  await updateTopicEmbeddings();
  
  // Set up storage change listener
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.topics || changes.sensitivity || changes.videoAction) {
      loadSettings().then(async () => {
        // Clear processed videos cache to re-evaluate with new settings
        clearProcessedVideosCache();
        await updateTopicEmbeddings();
        logger.info('Conscious YouTube: Settings changed, clearing video cache for re-evaluation');
        // Re-scan when settings change
        debouncedScan();
      });
    }
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

  return {
    scanForVideos,
    clearProcessedVideosCache,
    extractVideoTitle,
    shouldHideVideo,
    hideVideo,
    showVideo,
    deleteVideo
  };
}
