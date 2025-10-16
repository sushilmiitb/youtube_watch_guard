/**
 * Text Classifier Factory
 * Provides the appropriate text classifier implementation based on configuration
 */

import { getServerTextClassifier } from './textClassifierServer.js';
import logger from '../logger.js';

/**
 * Get the text classifier instance to use for classification
 * Currently returns server-based classifier, but can be extended to support
 * local AI classifier based on availability/configuration
 * 
 * @returns {Object} Text classifier instance with classify method
 *   classify(texts, topics) - Classifies texts against topics
 *     @param {Array<{id: string, text: string}>} texts - Texts to classify
 *     @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 *     @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
 */
export async function getTextClassifier() {
  // TODO: In the future, check if local AI is available
  // and return local classifier if preferred/available
  // Example:
  // const localAIAvailable = await checkLocalAIAvailability();
  // if (localAIAvailable) {
  //   return getLocalTextClassifier();
  // }
  
  // For now, return server-based classifier
  logger.info('Using server-based text classifier');
  return getServerTextClassifier();
}

