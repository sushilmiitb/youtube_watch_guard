// Test utilities for content script functions
// Reuses common functions from content.js and only overrides what's different for testing

// Import the common functions from content.js
const contentScript = require('../../content.js');

// Re-export the common functions that don't need changes
export const extractVideoTitle = contentScript.extractVideoTitle;
export const hideVideo = contentScript.hideVideo;
export const showVideo = contentScript.showVideo;
export const clearProcessedVideosCache = contentScript.clearProcessedVideosCache;

/**
 * Test-specific version of shouldHideVideo
 * Overrides the production version to always return true for testing DOM manipulation
 * @param {string} videoTitle - The title of the YouTube video to evaluate.
 * @param {string[]} [topics] - An array of excluded topics to check against.
 * @param {number} [threshold] - The sensitivity threshold (0-1) for hiding.
 * @returns {Promise<boolean>} - Always returns true in test mode.
 */
export async function shouldHideVideo(videoTitle, topics = [], threshold = 0.3) {
  if (!videoTitle) {
    return false;
  }

  // TEST MODE: Always hide videos and print titles to console
  console.log(`TEST MODE: Hiding video - "${videoTitle}"`);
  return true;
}
