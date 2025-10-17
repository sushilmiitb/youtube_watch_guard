/**
 * Text Classifier Factory
 * Provides the appropriate text classifier implementation based on configuration
 */

import { getServerTextClassifier } from './textClassifierServer.js';
import { getBuiltInTextClassifier, isBuiltInTextClassifierAvailable } from './textClassifierBuiltinAI.js';
import logger from '../logger.js';

/**
 * Get the text classifier instance to use for classification
 * Checks if built-in AI is available first, then falls back to server-based classifier
 * 
 * @returns {Promise<Object>} Text classifier instance with classify method
 *   classify(texts, topics) - Classifies texts against topics
 *     @param {Array<{id: string, text: string}>} texts - Texts to classify
 *     @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 *     @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
 */
export async function getTextClassifier() {
  // Check if built-in AI is available
  // const builtInAIAvailable = await isBuiltInTextClassifierAvailable();
  
  // if (builtInAIAvailable) {
  //   logger.info('Using built-in AI text classifier');
  //   return getBuiltInTextClassifier();
  // }
  
  // // Fall back to server-based classifier
  // logger.info('Built-in AI not available, using server-based text classifier');
  return getServerTextClassifier();
}

