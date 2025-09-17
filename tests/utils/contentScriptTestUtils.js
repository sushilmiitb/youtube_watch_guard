// Test utilities for content script functions
// Reuses common functions from hideUnwantedContent.js and only overrides what's different for testing

// Import the common functions from hideUnwantedContent.js
const hideUnwantedContent = require('../../src/contentScript/hideUnwantedContent.js');

// Re-export the common functions that don't need changes
export const extractVideoTitle = hideUnwantedContent.extractVideoTitle;
export const extractChannelName = hideUnwantedContent.extractChannelName;
export const extractVideoContext = hideUnwantedContent.extractVideoContext;
export const hideVideo = hideUnwantedContent.hideVideo;
export const showVideo = hideUnwantedContent.showVideo;
export const clearProcessedVideosCache = hideUnwantedContent.clearProcessedVideosCache;

/**
 * Test-specific version of shouldHideVideo
 * Overrides the production version to always return true for testing DOM manipulation
 * @param {Element} videoElement - The video element to evaluate.
 * @param {string[]} [topics] - An array of excluded topics to check against.
 * @param {number} [threshold] - The sensitivity threshold (0-1) for hiding.
 * @returns {Promise<boolean>} - Always returns true in test mode.
 */
export async function shouldHideVideo(videoElement, topics = [], threshold = 0.3) {
  const context = extractVideoContext(videoElement);
  if (!context) {
    return false;
  }

  // TEST MODE: Always hide videos and print context to console
  console.log(`TEST MODE: Hiding video - "${context}"`);
  return true;
}
