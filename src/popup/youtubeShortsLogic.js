/**
 * YouTube Shorts - Logic Layer
 * Handles business logic and storage operations for YouTube Shorts section
 */

import { setRemoveShortsSection, setupShortsRemovalListener } from './youtubeShortsView.js';

/**
 * Initialize the YouTube Shorts component
 * @returns {Object} - Component interface with public methods
 */
export async function initializeYouTubeShorts() {
  // Load Shorts section removal setting from storage and set checkbox
  let removeShortsSection = true;
  try {
    const result = await chrome.storage.local.get(['removeShortsSection']);
    removeShortsSection = result.removeShortsSection !== undefined ? !!result.removeShortsSection : true;
    
    // If no value exists in storage, save the default
    if (result.removeShortsSection === undefined) {
      await chrome.storage.local.set({ removeShortsSection: true });
    }
  } catch (error) {
    console.error('Failed to load Shorts section removal setting:', error);
  }
  
  // Set checkbox state using view function
  setRemoveShortsSection(removeShortsSection);
  
  // Set up event listener using view function
  setupShortsRemovalListener(async () => {
    const shortsCheckbox = document.getElementById('remove-shorts-section');
    if (shortsCheckbox) {
      await chrome.storage.local.set({ removeShortsSection: shortsCheckbox.checked });
    }
  });

  // Return public interface
  return {
    // Public methods for external access if needed
    getRemoveShortsSection: () => removeShortsSection
  };
}
