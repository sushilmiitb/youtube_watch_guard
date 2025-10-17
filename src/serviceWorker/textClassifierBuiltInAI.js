/**
 * Service Worker Module: Built-in AI Text Classifier
 * Uses Chrome's Prompt API (Gemini Nano) for text classification
 * This module runs in the service worker context
 * Documentation: https://developer.chrome.com/docs/ai/prompt-api
 */

import logger from '../logger.js';

/**
 * Check if built-in AI API is available in the browser
 * Uses LanguageModel.availability() to check if Gemini Nano is available
 * @returns {Promise<boolean>} True if built-in AI is available, false otherwise
 */
export async function getAIStatus() {
  try {
    // Check if the browser supports the built-in AI API (Prompt API)
    if (typeof LanguageModel !== 'undefined') {
      // Check availability of the language model
      const availability = await LanguageModel.availability();
      logger.info('Built-in AI (Prompt API) availability status:', availability);
      
      // Return true if model is available, downloadable, or downloading
      // 'unavailable' means it's not available on this device
      return availability === 'available';
    }
    logger.warn('Built-in AI API (Prompt API) not supported in this browser');
    return false;
  } catch (error) {
    logger.error('Error checking built-in AI status:', error);
    return false;
  }
}

/**
 * Classify texts against topics using built-in AI (Gemini Nano via Prompt API)
 * Processes texts with controlled parallelism (8 concurrent sessions)
 * Balances speed and resource usage
 * 
 * @param {Array<{id: string, text: string}>} texts - Texts to classify
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
 */
export async function classifyParallel(texts, topics) {
  // Validate inputs
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics must be a non-empty array');
  }

  try {
    // Check if the model is available
    const availability = await LanguageModel.availability();
    logger.debug('Model availability status:', availability);
    
    if (availability !== 'available') {
      throw new Error('Built-in AI model is not ready on this device');
    }

    const startTime = performance.now();
    const MAX_PARALLEL = 8; // Process 8 texts concurrently
    
    logger.info(`Starting hybrid parallel classification for ${texts.length} texts (${MAX_PARALLEL} concurrent)...`);

    // Process texts in parallel batches
    const results = [];
    for (let i = 0; i < texts.length; i += MAX_PARALLEL) {
      const batch = texts.slice(i, i + MAX_PARALLEL);
      const batchStartTime = performance.now();
      
      logger.debug(`Processing batch ${Math.floor(i / MAX_PARALLEL) + 1}`, {
        textsInBatch: batch.length,
        progress: `${i + batch.length}/${texts.length}`
      });
      
      // Process batch in parallel
      const batchPromises = batch.map(text => classifySingleText(text, topics));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      const batchEndTime = performance.now();
      const batchDuration = (batchEndTime - batchStartTime).toFixed(2);
      
      logger.info(`Batch ${Math.floor(i / MAX_PARALLEL) + 1} completed in ${batchDuration}ms`, {
        textsProcessed: batch.length,
        avgPerText: `${(batchDuration / batch.length).toFixed(2)}ms`
      });
    }

    const endTime = performance.now();
    const totalDuration = (endTime - startTime).toFixed(2);
    const avgDuration = (totalDuration / texts.length).toFixed(2);

    logger.info('Classification completed successfully', { 
      totalTexts: texts.length,
      successfulClassifications: results.filter(r => r.topic_ids.length > 0).length,
      totalDuration: `${totalDuration}ms`,
      avgDurationPerText: `${avgDuration}ms`
    });

    return results;

  } catch (error) {
    logger.error('Error in built-in AI text classification:', error);
    throw error;
  }
}

/**
 * Classify a single text in its own session
 * Used for parallel processing
 * 
 * @private
 * @param {Object} text - Single text object {id, text}
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {Promise<{text_id: string, topic_ids: string[]}>} Classification result
 */
async function classifySingleText(text, topics) {
  let session = null;
  
  try {
    const textStartTime = performance.now();
    
    // Create a session for this text
    session = await LanguageModel.create();
    
    // Define JSON Schema for structured output
    const responseSchema = {
      type: 'object',
      properties: {
        topic_ids: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['topic_ids'],
      additionalProperties: false
    };
    
    // Build prompt for single text
    const prompt = buildSingleTextPrompt(text, topics);
    
    logger.debug(`Classifying text`, { 
      textId: text.id,
      promptLength: prompt.length
    });
    
    // Send prompt to the model
    const result = await session.prompt(prompt, {
      responseConstraint: responseSchema,
      omitResponseConstraintInput: true
    });

    // Parse result
    const parsedResult = JSON.parse(result);
    
    const textEndTime = performance.now();
    const textDuration = (textEndTime - textStartTime).toFixed(2);
    
    logger.debug(`Text classified in ${textDuration}ms`, { 
      textId: text.id,
      topicCount: parsedResult.topic_ids?.length || 0,
      duration: `${textDuration}ms`
    });
    
    return {
      text_id: text.id,
      topic_ids: parsedResult.topic_ids || []
    };
    
  } catch (error) {
    logger.error(`Error classifying text ${text.id}:`, error);
    // Return empty classification on error
    return {
      text_id: text.id,
      topic_ids: []
    };
  } finally {
    // Clean up session
    if (session) {
      session.destroy();
    }
  }
}

/**
 * LEGACY: Classify texts sequentially with single session
 * Slower but most resource-efficient approach
 * 
 * @deprecated Use classify() instead which uses hybrid parallel approach
 * @param {Array<{id: string, text: string}>} texts - Texts to classify
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
 */
export async function classify(texts, topics) {
  // Validate inputs
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics must be a non-empty array');
  }

  try {
    // Check if the model is available
    const availability = await LanguageModel.availability();
    logger.debug('Model availability status:', availability);
    
    if (availability !== 'available') {
      throw new Error('Built-in AI model is not ready on this device');
    }

    const startTime = performance.now();
    logger.info(`Creating language model session for classifying ${texts.length} texts...`);
    
    // Create a single session for all classifications
    let session = await LanguageModel.create();
    
    // Define JSON Schema for structured output (single text response)
    const responseSchema = {
      type: 'object',
      properties: {
        topic_ids: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['topic_ids'],
      additionalProperties: false
    };

    const results = [];
    
    // Process texts one at a time using the same session
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      try {
        const textStartTime = performance.now();
        
        // Build prompt for single text
        const prompt = buildSingleTextPrompt(text, topics);
        
        logger.debug(`Classifying text ${i + 1}/${texts.length}`, { 
          textId: text.id,
          promptLength: prompt.length,
          sessionUsage: `${session.inputUsage}/${session.inputQuota}`
        });
        
        // Check if we're approaching quota limit (90% threshold)
        if (session.inputQuota > 0 && session.inputUsage / session.inputQuota > 0.9) {
          logger.warn('Approaching session quota limit, destroying and creating new session');
          session.destroy();
          session = await LanguageModel.create();
        }
        
        // Send prompt to the model
        const result = await session.prompt(prompt, {
          responseConstraint: responseSchema,
          omitResponseConstraintInput: true
        });

        // Parse and store result
        const parsedResult = JSON.parse(result);
        results.push({
          text_id: text.id,
          topic_ids: parsedResult.topic_ids || []
        });
        
        const textEndTime = performance.now();
        const textDuration = (textEndTime - textStartTime).toFixed(2);
        
        logger.debug(`Text ${i + 1}/${texts.length} classified in ${textDuration}ms`, { 
          textId: text.id,
          topicCount: parsedResult.topic_ids?.length || 0,
          duration: `${textDuration}ms`
        });
        
      } catch (error) {
        logger.error(`Error classifying text ${text.id}:`, error);
        // Continue with empty classification on error
        results.push({
          text_id: text.id,
          topic_ids: []
        });
      }
    }

    // Clean up session
    session.destroy();
    logger.debug('Language model session destroyed');

    const endTime = performance.now();
    const totalDuration = (endTime - startTime).toFixed(2);
    const avgDuration = (totalDuration / texts.length).toFixed(2);

    logger.info('Classification completed successfully', { 
      totalTexts: texts.length,
      successfulClassifications: results.filter(r => r.topic_ids.length > 0).length,
      totalDuration: `${totalDuration}ms`,
      avgDurationPerText: `${avgDuration}ms`
    });

    return results;

  } catch (error) {
    logger.error('Error in built-in AI text classification:', error);
    throw error;
  }
}

/**
 * LEGACY: Classify texts in batch mode (may hit token limits with many texts)
 * Kept for reference - processes all texts in a single prompt
 * 
 * @deprecated Use classify() instead which processes texts with controlled parallelism
 * @param {Array<{id: string, text: string}>} texts - Texts to classify
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {Promise<Array<{text_id: string, topic_ids: string[]}>>} Classification results
 */
export async function classifyBatch(texts, topics) {
  // Validate inputs
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array');
  }
  if (!Array.isArray(topics) || topics.length === 0) {
    throw new Error('Topics must be a non-empty array');
  }

  try {
    // Check if the model is available
    const availability = await LanguageModel.availability();
    logger.debug('Model availability status:', availability);
    
    if (availability !== 'available') {
      throw new Error('Built-in AI model is not ready on this device');
    }

    logger.info('Creating language model session for classification...');
    
    const startTime = performance.now();

    // Create a session for the language model
    const session = await LanguageModel.create();

    // Build the classification prompt
    const prompt = buildBatchClassificationPrompt(texts, topics);
    logger.debug('Classification prompt built', { 
      textCount: texts.length, 
      topicCount: topics.length,
      promptLength: prompt.length,
      prompt: prompt,
    });
    
    // Define JSON Schema for structured output
    const responseSchema = {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text_id: { type: 'string' },
              topic_ids: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['text_id', 'topic_ids'],
            additionalProperties: false
          }
        }
      },
      required: ['results'],
      additionalProperties: false
    };

    logger.info('Sending classification request to Gemini Nano...');
    
    // Send prompt to the model with structured output constraint
    const result = await session.prompt(prompt, {
      responseConstraint: responseSchema,
      omitResponseConstraintInput: true // Don't include schema in input quota
    });

    // Parse the JSON response
    const parsedResult = JSON.parse(result);

    // Clean up session
    session.destroy();
    logger.debug('Language model session destroyed');

    const endTime = performance.now();
    const textDuration = (endTime - startTime).toFixed(2);

    logger.debug('Classification completed successfully', { 
      textCount: texts.length,
      duration: `${textDuration}ms`
    });
    logger.debug('Classification results:', parsedResult);

    // Validate and return results
    if (parsedResult.results && Array.isArray(parsedResult.results)) {
      return parsedResult.results;
    }

    // If response doesn't match expected format, return empty results
    logger.warn('Unexpected response format, returning empty results');
    return texts.map(text => ({
      text_id: text.id,
      topic_ids: []
    }));

  } catch (error) {
    logger.error('Error in built-in AI text classification:', error);
    throw error;
  }
}

/**
 * Build a prompt for classifying a single text against topics
 * Much more compact than batch prompts, avoiding token limit issues
 * 
 * @private
 * @param {Object} text - Single text object {id, text}
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {string} The classification prompt
 */
function buildSingleTextPrompt(text, topics) {
  // Create a compact representation of topics
  const topicsList = topics.map(t => `${t.id}: ${t.topic}`).join('\n');
  
  const prompt = (
    'Classify this YouTube video title and channel name against the given topics.\n' +
    'Be strict: only match if the title clearly belongs to a topic.\n\n' +
    'Topics consist of topic ids and topic names. Topic ids are unique and used to identify the topic. Topic names are human readable and used to describe the topic.\n\n' +
    `Video Title and channel name: "${text.text}"\n\n` +
    `Topics:\n${topicsList}\n\n` +
    'Return a JSON object with topic_ids array containing IDs of matching topics (or empty array if none match).\n' +
    'Format: {"topic_ids": ["id1", "id2"]} or {"topic_ids": []}'
  );
  
  return prompt;
}

/**
 * LEGACY: Build a structured prompt for batch classification
 * Based on the Python implementation, adapted for the Prompt API
 * 
 * @private
 * @param {Array<{id: string, text: string}>} texts - Texts to classify
 * @param {Array<{id: string, topic: string}>} topics - Topics to classify against
 * @returns {string} The classification prompt
 */
function buildBatchClassificationPrompt(texts, topics) {
  const prompt = (
    'I have a list of youtube video titles along with channel names. I want to determine if that youtube title belongs to any of the topics.\n' +
    'Given the following texts (with IDs) and topics (with IDs), return a JSON object with a "results" field, which is an array of objects, each with a text_id and a topic_ids array (from the provided list) that the text clearly belongs to.\n' +
    'If a text does not belong to any, use an empty array. Be a little strict in categorizing. If it\'s not clear that the text belongs to a particular topic, classify it as none.\n\n' +
    `Texts: ${JSON.stringify(texts)}\n\n` +
    `Topics: ${JSON.stringify(topics)}\n\n` +
    'Respond with only a JSON object like: {"results": [{"text_id": "t1", "topic_ids": ["p"]}, {"text_id": "t2", "topic_ids": []}]}'
  );
  
  return prompt;
}

