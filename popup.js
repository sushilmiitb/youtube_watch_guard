/**
 * Popup Main Entry Point
 * Handles component wiring and initialization
 */

import { initializeHideUnwanted } from './src/popup/hideUnwantedLogic.js';
import { initializeYouTubeShorts } from './src/popup/youtubeShortsLogic.js';
import { initializeMarkVideos } from './src/popup/markVideosLogic.js';
import { renderTestModeIndicator } from './popupView.js';
import { MOCK_CLASSIFICATION_API_CALL } from './src/contentScript/textClassifierServer.js';
import logger from './src/logger.js';

/**
 * Initialize all popup components
 */
async function bootstrap() {
  try {
    // Initialize all components
    const hideUnwanted = await initializeHideUnwanted();
    const youtubeShorts = await initializeYouTubeShorts();
    const markVideos = await initializeMarkVideos();

    // Dynamically show test mode indicator if needed
    renderTestModeIndicator(MOCK_CLASSIFICATION_API_CALL);

    logger.info('All popup components initialized successfully');
    
    // Return component instances for potential external access
    return {
      hideUnwanted,
      youtubeShorts,
      markVideos
    };
  } catch (error) {
    console.error('Failed to initialize popup components:', error);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', bootstrap);