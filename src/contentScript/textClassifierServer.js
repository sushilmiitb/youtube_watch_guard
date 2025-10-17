/**
 * Server-based Text Classifier Implementation
 * Handles text classification via remote API endpoint
 * Includes configuration for API endpoints and providers
 */

import logger from '../logger.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * If true, classification API calls are mocked and videos are hidden with 90% probability.
 * If false, real API calls are made for text classification.
 */
export const MOCK_CLASSIFICATION_API_CALL = false; // Set to true for testing, false for production
export const ENV = 'production';

/**
 * The base URL of the backend classification API server.
 * This is mutable and can be set at runtime.
 */
let API_URL = 'http://127.0.0.1:8000'; // Default for local development

/**
 * Set the API URL at runtime (for internal use only).
 * @param {string} url - The new API base URL
 */
export function setApiUrl(url) {
  API_URL = url;
}

// Auto-switch to production URL if not running on localhost
if (ENV === 'production') {
  // API_URL = 'https://genai-inference-api-160164613372.us-central1.run.app';
  API_URL = 'https://sattvium.ddns.net';
  // API_URL = 'https://161.118.163.45:8080';
} else {
  API_URL = 'http://127.0.0.1:8000';
}

/**
 * The endpoint path for text classification API
 */
const CLASSIFICATION_ENDPOINT = '/classify-texts';

/**
 * AI provider for text classification
 */
const CLASSIFICATION_PROVIDER = 'GEMINI';

/**
 * AI model name for text classification
 */
const CLASSIFICATION_MODEL_NAME = 'gemini-2.5-flash';

// ============================================================================
// Server Text Classifier Implementation
// ============================================================================

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

