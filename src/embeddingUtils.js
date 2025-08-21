// Embedding utilities for semantic similarity
// TEST MODE: Always returns high similarity to test DOM manipulation

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
 * TEST MODE: Get a mock embedding for testing DOM manipulation.
 * This function returns a consistent mock embedding to test the video hiding functionality
 * without requiring actual embeddings or API calls.
 * @param {string} text Input text
 * @returns {Promise<number[]>} Mock embedding vector
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }
  
  // Return a mock embedding (384-dimensional vector with small random values)
  // This is the same dimension as the paraphrase-multilingual-MiniLM-L12-v2 model
  const mockEmbedding = new Array(384).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  return mockEmbedding;
}

/**
 * TEST MODE: Always returns a high similarity score to test video hiding.
 * This function simulates semantic similarity calculation but always returns
 * a value above the threshold to ensure videos are hidden for testing purposes.
 * @param {string} topic The excluded topic/category
 * @param {string} videoTitle The YouTube video title to evaluate
 * @returns {Promise<number>} Always returns 0.8 (high similarity for testing)
 */
export async function calculateTopicSimilarity(topic, videoTitle) {
  if (!topic || !videoTitle) {
    throw new Error('Topic and video title must be provided');
  }
  
  // TEST MODE: Always return high similarity to test DOM manipulation
  console.log(`TEST MODE: Simulating high similarity between topic "${topic}" and video "${videoTitle}"`);
  return 0.8; // High similarity score to ensure videos are hidden
}
