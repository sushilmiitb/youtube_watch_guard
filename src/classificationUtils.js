// Text classification utilities for semantic topic matching
// Batch processing only - replaces embedding-based similarity with direct classification

import { API_URL, CLASSIFICATION_ENDPOINT, MOCK_CLASSIFICATION_API_CALL, CLASSIFICATION_PROVIDER, CLASSIFICATION_MODEL_NAME } from './classificationConfig.js';
import logger from './logger.js';

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
 * @param {string[]} texts - Array of texts to classify
 * @param {string[]} topics - Array of topics to classify against
 * @returns {Promise<(string|null)[]>} Array of matched topics (same order as input texts)
 */
export async function classifyTextsBatch(texts, topics) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics must be a non-empty array');
  }

  if (MOCK_CLASSIFICATION_API_CALL) {
    // Mock mode: return random topic matches for each text
    return texts.map(text => {
      const shouldMatch = Math.random() < 0.9;
      if (shouldMatch) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        logger.debug(`🎭 MOCK CLASSIFIED: "${text}" → "${randomTopic}"`);
        return randomTopic;
      } else {
        logger.debug(`🎭 MOCK NO MATCH: "${text}" → (no topic match)`);
        return null;
      }
    });
  }

  try {
    // Format request according to API specification
    const requestBody = {
      texts: texts.map((text, index) => ({
        id: generateId('t', index),
        text: text
      })),
      topics: topics.map((topic, index) => ({
        id: generateId('p', index),
        topic: topic
      })),
      provider: CLASSIFICATION_PROVIDER,
      model_name: CLASSIFICATION_MODEL_NAME
    };

    logger.debug('Classification API request:', requestBody);
    
    const response = await fetch(`${API_URL}${CLASSIFICATION_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Handle error response format
      const errorData = await response.json();
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const errorMessages = errorData.detail.map(err => err.msg || 'Unknown error').join(', ');
        throw new Error(`Classification API error: ${response.status} - ${errorMessages}`);
      } else {
        throw new Error(`Classification API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    logger.debug('Classification API response:', data);
    
    // Handle the response format from the classification API
    if (data.results && Array.isArray(data.results)) {
      // Map results back to input order
      const results = new Array(texts.length).fill(null);
      
      for (const result of data.results) {
        // Find the text index by matching the text_id
        const textIndex = parseInt(result.text_id.replace('t', ''));

        if (textIndex >= 0 && textIndex < texts.length) {
          const originalText = texts[textIndex];
          
          // If there are matching topics, get the first one
          if (result.topic_ids && result.topic_ids.length > 0) {
            const topicIndex = parseInt(result.topic_ids[0].replace('p', ''));
            if (topicIndex >= 0 && topicIndex < topics.length) {
              const matchedTopic = topics[topicIndex];
              results[textIndex] = matchedTopic;
            }
          } 
        } else {
          logger.error(`⚠️ Invalid text index: ${textIndex} for text_id: ${result.text_id} (expected 0-${texts.length-1})`);
        }
      }
      
      return results;
    }
    
    // If no results found, return null for all texts
    return new Array(texts.length).fill(null);
  } catch (error) {
    logger.error('Error classifying texts batch:', error);
    throw error;
  }
}

/**
 * Process multiple video contexts and return hide decisions in batch.
 * @param {string[]} videoContexts - Array of video contexts to evaluate
 * @param {string[]} excludedTopics - Array of topics to exclude
 * @returns {Promise<boolean[]>} Array of hide decisions (same order as input contexts)
 */
export async function batchClassifyVideoContexts(videoContexts, excludedTopics) {
  if (!Array.isArray(videoContexts) || videoContexts.length === 0) {
    return [];
  }
  if (!Array.isArray(excludedTopics) || excludedTopics.length === 0) {
    return new Array(videoContexts.length).fill(false);
  }

  try {
    // Get batch classification results
    const batchResults = await classifyTextsBatch(videoContexts, excludedTopics);
    
    // Convert topic matches to hide decisions and log details
    const hideDecisions = batchResults.map((topic, index) => {
      const videoContext = videoContexts[index];
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