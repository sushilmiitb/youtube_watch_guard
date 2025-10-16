/**
 * Server-based Text Classifier Implementation
 * Handles text classification via remote API endpoint
 */

import { 
  API_URL, 
  CLASSIFICATION_ENDPOINT, 
  CLASSIFICATION_PROVIDER, 
  CLASSIFICATION_MODEL_NAME,
  MOCK_CLASSIFICATION_API_CALL 
} from '../classificationConfig.js';
import logger from '../logger.js';

/**
 * Server-based text classifier implementation
 * Conforms to the text classifier interface defined in PRD.md
 */
class ServerTextClassifier {
  /**
   * Classify texts against topics using server API
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

    // Mock mode for testing
    if (MOCK_CLASSIFICATION_API_CALL) {
      return this._mockClassify(texts, topics);
    }

    try {
      // Format request according to API specification
      const requestBody = {
        texts: texts,
        topics: topics,
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
      
      // Return results in expected format
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      
      // If no results, return empty matches for all texts
      return texts.map(text => ({
        text_id: text.id,
        topic_ids: []
      }));
    } catch (error) {
      logger.error('Error in server text classifier:', error);
      throw error;
    }
  }

  /**
   * Mock classification for testing
   * Returns random topic matches to simulate API behavior
   * @private
   * @param {Array<{id: string, text: string}>} texts - Texts to classify
   * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
   * @returns {Array<{text_id: string, topic_ids: string[]}>} Mock classification results
   */
  _mockClassify(texts, topics) {
    return texts.map(text => {
      const shouldMatch = Math.random() < 0.9;
      if (shouldMatch) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        logger.debug(`🎭 MOCK CLASSIFIED: "${text.text}" → "${randomTopic.topic}"`);
        return {
          text_id: text.id,
          topic_ids: [randomTopic.id]
        };
      } else {
        logger.debug(`🎭 MOCK NO MATCH: "${text.text}" → (no topic match)`);
        return {
          text_id: text.id,
          topic_ids: []
        };
      }
    });
  }
}

/**
 * Get server-based text classifier instance
 * @returns {ServerTextClassifier} Classifier instance
 */
export function getServerTextClassifier() {
  return new ServerTextClassifier();
}

