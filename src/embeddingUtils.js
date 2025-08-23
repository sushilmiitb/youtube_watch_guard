// Embedding utilities for semantic similarity
// TEST MODE: Always returns high similarity to test DOM manipulation

import { API_URL, MODEL_NAME, MOCK_EMBEDDING_API_CALL } from './embeddingConfig.js';
import logger from './logger.js';

/**
 * Calculate the cosine similarity between two equal-length numeric vectors.
 * When to use: any time you need a similarity score between two embeddings.
 * Returns a value in [-1, 1] where 1 means identical direction, 0 means orthogonal,
 * and -1 means opposite direction.
 * @param {number[]} vectorA First embedding vector
 * @param {number[]} vectorB Second embedding vector
 * @returns {number} Cosine similarity in the range [-1, 1]
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be non-null and have the same length');
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

/**
 * Get an embedding for the given text from the backend API, or mock if test mode is on.
 * @param {string} text Input text
 * @returns {Promise<number[]>} Embedding vector
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  if (MOCK_EMBEDDING_API_CALL) {
    // Return a mock embedding (384-dimensional vector with small random values)
    return new Array(384).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }
  try {
    const response = await fetch(`${API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_name: MODEL_NAME }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid embedding response');
    }
    return data.embeddings;
  } catch (error) {
    logger.error('Error fetching embedding:', error);
    throw error;
  }
}

/**
 * Get embeddings for a batch of texts from the backend API.
 * @param {string[]} texts - Array of input texts (e.g., video titles)
 * @returns {Promise<number[][]>} Array of embedding vectors, in the same order as input texts
 */
export async function getBatchEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (MOCK_EMBEDDING_API_CALL) {
    // Return mock embeddings (384-dim vectors with small random values)
    return texts.map(() => new Array(384).fill(0).map(() => (Math.random() - 0.5) * 0.1));
  }
  try {
    const response = await fetch(`${API_URL}/batch-embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, model_name: MODEL_NAME }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.embeddings || !Array.isArray(data.embeddings)) {
      throw new Error('Invalid batch embedding response');
    }
    return data.embeddings;
  } catch (error) {
    logger.error('Error fetching batch embeddings:', error);
    throw error;
  }
}

/**
 * Calculate the semantic similarity between a topic and a video title using embeddings, or mock if test mode is on.
 * @param {string} topic The excluded topic/category
 * @param {string} videoTitle The YouTube video title to evaluate
 * @returns {Promise<number>} Cosine similarity between topic and video title, or 0.9 if mock mode (90% hide)
 */
export async function calculateTopicSimilarity(topic, videoTitle) {
  if (!topic || !videoTitle) {
    throw new Error('Topic and video title must be provided');
  }
  if (MOCK_EMBEDDING_API_CALL) {
    // 90% probability to hide video (return high similarity)
    const shouldHide = Math.random() < 0.9;
    logger.debug(`MOCK MODE: ${shouldHide ? 'Hiding' : 'Showing'} video - topic: "${topic}", title: "${videoTitle}"`);
    return shouldHide ? 0.9 : 0.1;
  }
  try {
    const [topicEmbedding, videoEmbedding] = await Promise.all([
      getEmbedding(topic),
      getEmbedding(videoTitle),
    ]);
    return cosineSimilarity(topicEmbedding, videoEmbedding);
  } catch (error) {
    logger.error('Error calculating similarity:', error);
    return 0; // Fallback: treat as not similar
  }
}
