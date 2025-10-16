import { 
  classifyTextsBatch, 
  batchClassifyVideoContexts 
} from '../../src/contentScript/classificationUtils.js';

// Mock the textClassifierServer module
jest.mock('../../src/contentScript/textClassifierServer.js', () => ({
  getServerTextClassifier: jest.fn(() => ({
    classify: global.mockClassify
  }))
}));

// Mock fetch for testing (will be used by the classifier)
global.fetch = jest.fn();
global.mockClassify = jest.fn();

// Mock the config to disable mock mode for API testing
jest.mock('../../src/contentScript/classificationConfig.js', () => ({
  API_URL: 'http://test-api.com',
  CLASSIFICATION_ENDPOINT: '/classify_texts',
  MOCK_CLASSIFICATION_API_CALL: false, // Disable mock mode for API testing
  CLASSIFICATION_PROVIDER: 'GEMINI',
  CLASSIFICATION_MODEL_NAME: 'gemini-2.5-flash',
}));

describe('classificationUtils', () => {
  let mockClassifier;
  
  beforeEach(() => {
    fetch.mockClear();
    // Create a fresh mock classifier for each test
    mockClassifier = {
      classify: jest.fn()
    };
  });

  describe('classifyTextsBatch', () => {
    test('should format request correctly for API', async () => {
      const texts = ['cricket video', 'football highlights'];
      const topics = ['cricket', 'football'];
      
      // Mock successful classifier response
      const mockResponse = [
        { text_id: 't0', topic_ids: ['p0'] },
        { text_id: 't1', topic_ids: ['p1'] }
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await classifyTextsBatch(mockClassifier, texts, topics);
      
      // Verify classifier was called with correct format
      expect(mockClassifier.classify).toHaveBeenCalledWith(
        [
          { id: 't0', text: 'cricket video' },
          { id: 't1', text: 'football highlights' }
        ],
        [
          { id: 'p0', topic: 'cricket' },
          { id: 'p1', topic: 'football' }
        ]
      );
      
      expect(results).toEqual(['cricket', 'football']);
    });

    test('should handle classifier response with no matches', async () => {
      const texts = ['cooking video', 'music concert'];
      const topics = ['cricket', 'football'];
      
      // Mock classifier response with no matches
      const mockResponse = [
        { text_id: 't0', topic_ids: [] },
        { text_id: 't1', topic_ids: [] }
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await classifyTextsBatch(mockClassifier, texts, topics);
      
      expect(results).toEqual([null, null]);
    });

    test('should handle classifier error', async () => {
      const texts = ['test text'];
      const topics = ['test topic'];
      
      // Mock classifier error
      mockClassifier.classify.mockRejectedValueOnce(new Error('Classifier error'));

      await expect(classifyTextsBatch(mockClassifier, texts, topics)).rejects.toThrow('Classifier error');
    });

    test('should throw error for invalid classifier', async () => {
      await expect(classifyTextsBatch(null, ['text1'], ['cricket'])).rejects.toThrow('Valid classifier instance required');
    });

    test('should throw error for empty texts array', async () => {
      await expect(classifyTextsBatch(mockClassifier, [], ['cricket'])).rejects.toThrow('Texts must be a non-empty array');
    });

    test('should throw error for empty topics array', async () => {
      await expect(classifyTextsBatch(mockClassifier, ['text1'], [])).rejects.toThrow('Topics must be a non-empty array');
    });

    test('should throw error for non-array texts', async () => {
      await expect(classifyTextsBatch(mockClassifier, 'text1', ['cricket'])).rejects.toThrow('Texts must be a non-empty array');
    });

    test('should throw error for non-array topics', async () => {
      await expect(classifyTextsBatch(mockClassifier, ['text1'], 'cricket')).rejects.toThrow('Topics must be a non-empty array');
    });

    test('should handle single text input', async () => {
      const texts = ['cricket video'];
      const topics = ['cricket', 'football'];
      
      const mockResponse = [
        { text_id: 't0', topic_ids: ['p0'] }
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await classifyTextsBatch(mockClassifier, texts, topics);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toBe('cricket');
    });
  });

  describe('batchClassifyVideoContexts', () => {
    test('should return boolean array matching input length', async () => {
      const contexts = ['cricket video', 'football highlights', 'tennis match'];
      const topics = ['cricket', 'football', 'tennis'];
      
      const mockResponse = [
        { text_id: 't0', topic_ids: ['p0'] },
        { text_id: 't1', topic_ids: ['p1'] },
        { text_id: 't2', topic_ids: [] }
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await batchClassifyVideoContexts(mockClassifier, contexts, topics);
      
      expect(results).toHaveLength(contexts.length);
      expect(results).toEqual([true, true, false]);
    });

    test('should return empty array for empty contexts', async () => {
      const results = await batchClassifyVideoContexts(mockClassifier, [], ['cricket']);
      expect(results).toEqual([]);
    });

    test('should return false array for empty topics', async () => {
      const contexts = ['cricket video', 'football highlights'];
      const results = await batchClassifyVideoContexts(mockClassifier, contexts, []);
      
      expect(results).toHaveLength(contexts.length);
      expect(results.every(result => result === false)).toBe(true);
    });

    test('should handle classifier errors gracefully', async () => {
      const contexts = ['cricket video', 'football highlights'];
      const topics = ['cricket', 'football'];
      
      // Mock classifier error
      mockClassifier.classify.mockRejectedValueOnce(new Error('Network error'));

      const results = await batchClassifyVideoContexts(mockClassifier, contexts, topics);
      
      expect(results).toHaveLength(contexts.length);
      expect(results.every(result => result === false)).toBe(true);
    });

    test('should handle single context input', async () => {
      const contexts = ['cricket video'];
      const topics = ['cricket', 'football'];
      
      const mockResponse = [
        { text_id: 't0', topic_ids: ['p0'] }
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await batchClassifyVideoContexts(mockClassifier, contexts, topics);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(true);
    });

    test('should convert topic matches to hide decisions correctly', async () => {
      const contexts = ['cricket video', 'cooking show', 'tennis match'];
      const topics = ['cricket', 'tennis']; // Only cricket and tennis should match
      
      const mockResponse = [
        { text_id: 't0', topic_ids: ['p0'] }, // cricket video -> cricket
        { text_id: 't1', topic_ids: [] },     // cooking show -> no match
        { text_id: 't2', topic_ids: ['p1'] }  // tennis match -> tennis
      ];
      
      mockClassifier.classify.mockResolvedValueOnce(mockResponse);

      const results = await batchClassifyVideoContexts(mockClassifier, contexts, topics);
      
      expect(results).toEqual([true, false, true]);
    });
  });
});