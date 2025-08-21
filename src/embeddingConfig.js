// Centralized configuration for embedding API and test mode

/**
 * If true, embedding API calls are mocked and videos are hidden with 90% probability.
 * If false, real API calls are made for embeddings and similarity.
 */
export const MOCK_EMBEDDING_API_CALL = false; // Set to false for production

/**
 * The base URL of the backend embedding API server.
 */
export const API_URL = 'http://127.0.0.1:8000';

/**
 * The HuggingFace model name to use for embeddings.
 */
export const MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
