import { 
  classifyTextsBatch, 
  batchClassifyVideoContexts 
} from '../../src/classificationUtils.js';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock the config to disable mock mode for API testing
jest.mock('../../src/classificationConfig.js', () => ({
  API_URL: 'http://test-api.com',
  CLASSIFICATION_ENDPOINT: '/classify_texts',
  MOCK_CLASSIFICATION_API_CALL: false, // Disable mock mode for API testing
  CLASSIFICATION_PROVIDER: 'GEMINI',
  CLASSIFICATION_MODEL_NAME: 'gemini-2.5-flash',
}));

describe('classificationUtils', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('classifyTextsBatch', () => {
    test('should format request correctly for API', async () => {
      const texts = ['cricket video', 'football highlights'];
      const topics = ['cricket', 'football'];
      
      // Mock successful API response
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: ['p0'] },
          { text_id: 't1', topic_ids: ['p1'] }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await classifyTextsBatch(texts, topics);
      
      // Verify API was called with correct format
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/classify_texts'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: [
              { id: 't0', text: 'cricket video' },
              { id: 't1', text: 'football highlights' }
            ],
            topics: [
              { id: 'p0', topic: 'cricket' },
              { id: 'p1', topic: 'football' }
            ],
            provider: 'GEMINI',
            model_name: 'gemini-2.5-flash'
          })
        })
      );
      
      expect(results).toEqual(['cricket', 'football']);
    });

    test('should handle API response with no matches', async () => {
      const texts = ['cooking video', 'music concert'];
      const topics = ['cricket', 'football'];
      
      // Mock API response with no matches
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: [] },
          { text_id: 't1', topic_ids: [] }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await classifyTextsBatch(texts, topics);
      
      expect(results).toEqual([null, null]);
    });

    test('should handle API error response format', async () => {
      const texts = ['test text'];
      const topics = ['test topic'];
      
      // Mock API error response
      const errorResponse = {
        detail: [
          { loc: ['string', 0], msg: 'Invalid input format', type: 'value_error' }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(classifyTextsBatch(texts, topics)).rejects.toThrow('Classification API error: 400 - Invalid input format');
    });

    test('should throw error for empty texts array', async () => {
      await expect(classifyTextsBatch([], ['cricket'])).rejects.toThrow('Texts must be a non-empty array');
    });

    test('should throw error for empty topics array', async () => {
      await expect(classifyTextsBatch(['text1'], [])).rejects.toThrow('Topics must be a non-empty array');
    });

    test('should throw error for non-array texts', async () => {
      await expect(classifyTextsBatch('text1', ['cricket'])).rejects.toThrow('Texts must be a non-empty array');
    });

    test('should throw error for non-array topics', async () => {
      await expect(classifyTextsBatch(['text1'], 'cricket')).rejects.toThrow('Topics must be a non-empty array');
    });

    test('should handle single text input', async () => {
      const texts = ['cricket video'];
      const topics = ['cricket', 'football'];
      
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: ['p0'] }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await classifyTextsBatch(texts, topics);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toBe('cricket');
    });
  });

  describe('batchClassifyVideoContexts', () => {
    test('should return boolean array matching input length', async () => {
      const contexts = ['cricket video', 'football highlights', 'tennis match'];
      const topics = ['cricket', 'football', 'tennis'];
      
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: ['p0'] },
          { text_id: 't1', topic_ids: ['p1'] },
          { text_id: 't2', topic_ids: [] }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await batchClassifyVideoContexts(contexts, topics);
      
      expect(results).toHaveLength(contexts.length);
      expect(results).toEqual([true, true, false]);
    });

    test('should return empty array for empty contexts', async () => {
      const results = await batchClassifyVideoContexts([], ['cricket']);
      expect(results).toEqual([]);
    });

    test('should return false array for empty topics', async () => {
      const contexts = ['cricket video', 'football highlights'];
      const results = await batchClassifyVideoContexts(contexts, []);
      
      expect(results).toHaveLength(contexts.length);
      expect(results.every(result => result === false)).toBe(true);
    });

    test('should handle API errors gracefully', async () => {
      const contexts = ['cricket video', 'football highlights'];
      const topics = ['cricket', 'football'];
      
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await batchClassifyVideoContexts(contexts, topics);
      
      expect(results).toHaveLength(contexts.length);
      expect(results.every(result => result === false)).toBe(true);
    });

    test('should handle single context input', async () => {
      const contexts = ['cricket video'];
      const topics = ['cricket', 'football'];
      
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: ['p0'] }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await batchClassifyVideoContexts(contexts, topics);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toBe(true);
    });

    test('should convert topic matches to hide decisions correctly', async () => {
      const contexts = ['cricket video', 'cooking show', 'tennis match'];
      const topics = ['cricket', 'tennis']; // Only cricket and tennis should match
      
      const mockResponse = {
        results: [
          { text_id: 't0', topic_ids: ['p0'] }, // cricket video -> cricket
          { text_id: 't1', topic_ids: [] },     // cooking show -> no match
          { text_id: 't2', topic_ids: ['p1'] }  // tennis match -> tennis
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await batchClassifyVideoContexts(contexts, topics);
      
      expect(results).toEqual([true, false, true]);
    });
  });
});