/**
 * Text classification utilities for semantic topic matching
 * Batch processing for direct classification using dependency injection
 */

import logger from '../logger.js';

/**
 * Generate a unique ID for text/topic items
 * @param {string} prefix - Prefix for the ID (e.g., 't' for text, 'p' for topic)
 * @param {number} index - Index of the item
 * @returns {string} Unique ID
 */
function generateId(prefix, index) {
  return `${prefix}${index}`;
}

/**
 * Classify multiple texts against a list of topics in batch.
 * Uses dependency injection to receive the classifier implementation.
 * 
 * @param {Object} classifier - Text classifier instance with classify method
 * @param {string[]} texts - Array of texts to classify
 * @param {string[]} topics - Array of topics to classify against
 * @returns {Promise<(string|null)[]>} Array of matched topics (same order as input texts)
 */
export async function classifyTextsBatch(classifier, texts, topics) {
  if (!classifier || typeof classifier.classify !== 'function') {
    throw new Error('Valid classifier instance required');
  }
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics must be a non-empty array');
  }

  try {
    // Prepare texts and topics with IDs as per API specification
    const textsWithIds = texts.map((text, index) => ({
      id: generateId('t', index),
      text: text
    }));
    
    const topicsWithIds = topics.map((topic, index) => ({
      id: generateId('p', index),
      topic: topic
    }));

    logger.debug('Prepared texts for classification:', textsWithIds);
    logger.debug('Prepared topics for classification:', topicsWithIds);
    
    // Call the classifier's classify method
    // Expected return format: Array<{text_id: string, topic_ids: string[]}>
    const results = await classifier.classify(textsWithIds, topicsWithIds);
    
    logger.debug('Classification results:', results);
    
    // Map results back to input order
    const matchedTopics = new Array(texts.length).fill(null);
    
    for (const result of results) {
      // Find the text index by matching the text_id
      const textIndex = parseInt(result.text_id.replace('t', ''));

      if (textIndex >= 0 && textIndex < texts.length) {
        // If there are matching topics, get the first one
        if (result.topic_ids && result.topic_ids.length > 0) {
          const topicIndex = parseInt(result.topic_ids[0].replace('p', ''));
          if (topicIndex >= 0 && topicIndex < topics.length) {
            const matchedTopic = topics[topicIndex];
            matchedTopics[textIndex] = matchedTopic;
          }
        } 
      } else {
        logger.error(`⚠️ Invalid text index: ${textIndex} for text_id: ${result.text_id} (expected 0-${texts.length-1})`);
      }
    }
    
    return matchedTopics;
  } catch (error) {
    logger.error('Error classifying texts batch:', error);
    throw error;
  }
}

/**
 * Process multiple video contexts and return hide decisions in batch.
 * Uses the injected classifier to determine which videos match excluded topics.
 * 
 * @param {Object} classifier - Text classifier instance with classify method
 * @param {string[]} videoContexts - Array of video contexts to evaluate
 * @param {string[]} excludedTopics - Array of topics to exclude
 * @returns {Promise<boolean[]>} Array of hide decisions (same order as input contexts)
 */
export async function batchClassifyVideoContexts(classifier, videoContexts, excludedTopics) {
  if (!Array.isArray(videoContexts) || videoContexts.length === 0) {
    return [];
  }
  if (!Array.isArray(excludedTopics) || excludedTopics.length === 0) {
    return new Array(videoContexts.length).fill(false);
  }

  try {
    // Get batch classification results
    const batchResults = await classifyTextsBatch(classifier, videoContexts, excludedTopics);
    
    // Convert topic matches to hide decisions
    const hideDecisions = batchResults.map((topic, index) => {
      const shouldHide = topic !== null;
      return shouldHide;
    });
    
    const hideCount = hideDecisions.filter(r => r).length;
    const totalCount = hideDecisions.length;
    logger.info(`📊 Batch classification summary: ${hideCount}/${totalCount} videos will be hidden`);
    
    return hideDecisions;
  } catch (error) {
    logger.error('Error in batch classification:', error);
    // Fallback: don't hide any videos on error
    return new Array(videoContexts.length).fill(false);
  }
}

