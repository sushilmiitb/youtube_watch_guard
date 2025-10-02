// Centralized configuration for embedding API and test mode

/**
 * If true, embedding API calls are mocked and videos are hidden with 90% probability.
 * If false, real API calls are made for embeddings and similarity.
 */
export const MOCK_EMBEDDING_API_CALL = false; // Set to false for production
export const ENV = 'production';

/**
 * The base URL of the backend embedding API server.
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
}else {
    API_URL = 'http://127.0.0.1:8000';
}

/**
 * The HuggingFace model name to use for embeddings.
 */
export const MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
