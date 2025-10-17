/**
 * Built-in AI Text Classifier Implementation
 * Uses Chrome's built-in AI API via service worker messaging
 */

import logger from '../logger.js';

/**
 * Built-in AI text classifier implementation
 * Conforms to the text classifier interface defined in PRD.md
 * Communicates with service worker to use built-in AI API
 */
class BuiltInAITextClassifier {
  /**
   * Check if built-in AI is available
   * @returns {Promise<boolean>} True if built-in AI is available
   */
  async isAvailable() {
    try {
      const response = await this._sendMessage({
        type: 'TEXT_CLASSIFIER',
        action: 'CHECK_AVAILABILITY'
      });
      
      if (response.success && response.available) {
        logger.info('Built-in AI text classifier is available');
        return true;
      }
      
      logger.info('Built-in AI text classifier is not available');
      return false;
    } catch (error) {
      logger.error('Error checking built-in AI availability:', error);
      return false;
    }
  }

  /**
   * Classify texts against topics using built-in AI
   * @param {Array<{id: string, text: string}>} texts - Texts to classify
   * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
   * @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
   */
  async classify(texts, topics) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Topics must be a non-empty array');
    }

    try {
      logger.debug('Sending classification request to service worker:', { 
        textCount: texts.length, 
        topicCount: topics.length 
      });

      const response = await this._sendMessage({
        type: 'TEXT_CLASSIFIER',
        action: 'CLASSIFY',
        payload: { texts, topics }
      });

      if (!response.success) {
        throw new Error(response.error || 'Classification failed');
      }

      logger.debug('Classification response received:', response.results);
      return response.results;
    } catch (error) {
      logger.error('Error in built-in AI text classifier:', error);
      throw error;
    }
  }

  /**
   * Send message to service worker and wait for response
   * @private
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Response from service worker
   */
  _sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          // Check if response indicates failure
          if (response && !response.success) {
            reject(new Error(response.error || 'Unknown error'));
            return;
          }
          
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Singleton instance
let classifierInstance = null;

/**
 * Get built-in AI text classifier instance
 * @returns {BuiltInAITextClassifier} Classifier instance
 */
export function getBuiltInTextClassifier() {
  if (!classifierInstance) {
    classifierInstance = new BuiltInAITextClassifier();
  }
  return classifierInstance;
}

/**
 * Check if built-in text classifier is available
 * This is a convenience function that can be called from content scripts
 * @returns {Promise<boolean>} True if built-in AI is available
 */
export async function isBuiltInTextClassifierAvailable() {
  const classifier = getBuiltInTextClassifier();
  return await classifier.isAvailable();
}

