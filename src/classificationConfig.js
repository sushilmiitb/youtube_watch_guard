// Centralized configuration for text classification API and test mode

/**
 * If true, classification API calls are mocked and videos are hidden with 90% probability.
 * If false, real API calls are made for text classification.
 */
export const MOCK_CLASSIFICATION_API_CALL = false; // Set to true for testing, false for production
export const ENV = 'development';

/**
 * The base URL of the backend classification API server.
 * This is mutable and can be set at runtime.
 */
export let API_URL = 'http://127.0.0.1:8000'; // Default for local development

/**
 * Set the API URL at runtime (for internal use only).
 * @param {string} url - The new API base URL
 */
export function setApiUrl(url) {
  API_URL = url;
}

// Auto-switch to production URL if not running on localhost
if (ENV === 'production') {
    API_URL = 'https://genai-inference-api-160164613372.us-central1.run.app';
    // API_URL = 'https://161.118.163.45:8080';
} else {
    API_URL = 'http://127.0.0.1:8000';
}

/**
 * The endpoint path for text classification API
 */
export const CLASSIFICATION_ENDPOINT = '/classify-texts';

/**
 * AI provider for text classification
 */
export const CLASSIFICATION_PROVIDER = 'GEMINI';

/**
 * AI model name for text classification
 */
export const CLASSIFICATION_MODEL_NAME = 'gemini-2.5-flash';
