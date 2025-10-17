/**
 * Service Worker for Youtube Watch Guard
 * Handles background tasks and messaging between content scripts and service worker modules
 */

import { getAIStatus, classify as classifyWithBuiltInAI } from './src/serviceWorker/textClassifierBuiltInAI.js';
import logger from './src/logger.js';

/**
 * Handle messages from content scripts and popup
 * Acts as a router to different service worker modules
 * @param {Object} message - The message object
 * @param {MessageSender} sender - Information about the sender
 * @param {Function} sendResponse - Function to send response back
 * @returns {boolean} true if response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from text classifier (built-in AI)
  if (message.type === 'TEXT_CLASSIFIER') {
    handleTextClassifierMessage(message, sendResponse);
    return true; // Indicates we will send response asynchronously
  }

  // Add more message handlers here for other features
  // Example:
  // if (message.type === 'ANOTHER_FEATURE') {
  //   handleAnotherFeatureMessage(message, sendResponse);
  //   return true;
  // }

  return false; // No handler found
});

/**
 * Handle text classifier related messages
 * Routes to appropriate built-in AI classifier functions
 * @param {Object} message - The message object
 * @param {Function} sendResponse - Function to send response back
 */
async function handleTextClassifierMessage(message, sendResponse) {
  try {
    logger.debug('Handling text classifier message:', message.action);
    
    switch (message.action) {
      case 'CHECK_AVAILABILITY':
        // Check if built-in AI is available
        const isAvailable = await getAIStatus();
        logger.info('Built-in AI availability check result:', isAvailable);
        sendResponse({ success: true, available: isAvailable });
        break;

      case 'CLASSIFY':
        // Classify texts against topics using built-in AI
        const { texts, topics } = message.payload;
        logger.debug('Classification request:', { textCount: texts.length, topicCount: topics.length });
        const results = await classifyWithBuiltInAI(texts, topics);
        logger.info('Classification completed successfully');
        sendResponse({ success: true, results });
        break;

      default:
        logger.warn('Unknown action received:', message.action);
        sendResponse({ 
          success: false, 
          error: `Unknown action: ${message.action}` 
        });
    }
  } catch (error) {
    logger.error('Error in text classifier message handler:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    });
  }
}

