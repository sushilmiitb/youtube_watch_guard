import { cosineSimilarity, getEmbedding, calculateTopicSimilarity } from '../../src/embeddingUtils.js';

describe('embeddingUtils', () => {
  describe('cosineSimilarity', () => {
    test('should calculate correct cosine similarity', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [1, 0, 0];
      expect(cosineSimilarity(vectorA, vectorB)).toBe(1);
    });

    test('should return 0 for orthogonal vectors', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      expect(cosineSimilarity(vectorA, vectorB)).toBe(0);
    });

    test('should throw error for different length vectors', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('getEmbedding', () => {
    test('should return 384-dimensional vector', async () => {
      const embedding = await getEmbedding('test text');
      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    test('should return different embeddings for different calls (random)', async () => {
      const embedding1 = await getEmbedding('test text');
      const embedding2 = await getEmbedding('test text');
      // In test mode, embeddings are random, so they should be different
      expect(embedding1).not.toEqual(embedding2);
    });

    test('should throw error for empty text', async () => {
      await expect(getEmbedding('')).rejects.toThrow();
    });

    test('should throw error for non-string input', async () => {
      await expect(getEmbedding(null)).rejects.toThrow();
    });
  });

  describe('calculateTopicSimilarity', () => {
    test('should always return 0.8 in test mode', async () => {
      const similarity = await calculateTopicSimilarity('cricket', 'Best cricket moments 2024');
      expect(similarity).toBe(0.8);
    });

    test('should throw error for empty topic', async () => {
      await expect(calculateTopicSimilarity('', 'video title')).rejects.toThrow();
    });

    test('should throw error for empty video title', async () => {
      await expect(calculateTopicSimilarity('topic', '')).rejects.toThrow();
    });
  });
});
