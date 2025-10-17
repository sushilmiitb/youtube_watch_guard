# Built-in AI Text Classifier Implementation

This document describes the implementation of the built-in AI text classifier using Chrome's Prompt API (Gemini Nano).

## Overview

The YouTube Watch Guard extension now supports two text classification methods:
1. **Built-in AI (Gemini Nano)** - Uses Chrome's on-device AI model via the Prompt API
2. **Server-based API** - Falls back to remote API when built-in AI is not available

## Architecture

```
Content Script (textClassifierBuiltinAI.js)
    ↓ (chrome.runtime.sendMessage)
Service Worker (service-worker.js)
    ↓ (routes messages)
Service Worker Module (textClassifierBuiltInAI.js)
    ↓ (uses LanguageModel API)
Chrome's Prompt API (Gemini Nano)
```

## Files Created/Modified

### New Files

1. **`service-worker.js`** (root level)
   - Main service worker entry point
   - Handles messages from content scripts
   - Routes TEXT_CLASSIFIER messages to appropriate handlers
   - Uses logger for consistent logging

2. **`src/serviceWorker/textClassifierBuiltInAI.js`**
   - Service worker module for built-in AI classification
   - `getAIStatus()`: Checks if Gemini Nano is available using `LanguageModel.availability()`
   - `classify()`: Performs classification using Prompt API with structured JSON output
   - Uses JSON Schema for consistent response format
   - Implements session management with proper cleanup

3. **`src/contentScript/textClassifierBuiltinAI.js`**
   - Content script module for built-in AI classifier
   - `BuiltInAITextClassifier` class: Implements the text classifier interface
   - `isBuiltInTextClassifierAvailable()`: Checks availability via service worker messaging
   - `getBuiltInTextClassifier()`: Returns singleton classifier instance
   - Handles message passing to/from service worker

### Modified Files

1. **`src/contentScript/textClassifier.js`**
   - Updated `getTextClassifier()` to check built-in AI availability first
   - Falls back to server-based classifier if built-in AI is not available
   - Provides transparent switching between classifiers

2. **`manifest.json`**
   - Added `background.service_worker` configuration
   - Added `textClassifierBuiltinAI.js` to web_accessible_resources
   - Enabled ES modules support with `"type": "module"`

## Key Features

### 1. Availability Check
- Uses `LanguageModel.availability()` to check if Gemini Nano is ready
- Returns status: `'available'`, `'downloadable'`, `'downloading'`, or `'unavailable'`
- Only proceeds with classification when status is `'available'`

### 2. Structured Output
- Uses JSON Schema with `responseConstraint` option
- Ensures consistent response format:
  ```json
  {
    "results": [
      {
        "text_id": "t1",
        "topic_ids": ["topic1", "topic2"]
      }
    ]
  }
  ```
- Uses `omitResponseConstraintInput: true` to avoid consuming input quota

### 3. Classification Prompt
Based on the Python implementation, the prompt instructs Gemini Nano to:
- Classify YouTube video titles against given topics
- Be strict in categorization (only classify if clearly matches)
- Return empty array if text doesn't belong to any topic
- Use JSON format for structured output

### 4. Session Management
- Creates a new session for each classification request
- Properly destroys session after classification to free resources
- Handles errors gracefully with proper cleanup

### 5. Logging
- Uses `logger.js` throughout for consistent logging
- Different log levels: `debug`, `info`, `warn`, `error`
- Helps with debugging and monitoring classification behavior

## Usage

The classifier is automatically selected based on availability:

```javascript
// In content scripts
import { getTextClassifier } from './textClassifier.js';

const classifier = await getTextClassifier();
// Returns built-in AI classifier if available, otherwise server-based

const results = await classifier.classify(
  [{ id: 't1', text: 'Video title here' }],
  [{ id: 'p1', topic: 'Technology' }]
);
```

## Requirements

For built-in AI to work, users need:
- Chrome 138+ (or Chrome with Prompt API support)
- Windows 10/11, macOS 13+, Linux, or ChromeOS on Chromebook Plus
- At least 22 GB free storage (for Gemini Nano model)
- GPU with >4GB VRAM or CPU with 16GB RAM and 4+ cores
- Unmetered network connection for model download

## Testing

To test the built-in AI classifier:

1. Enable the Prompt API in Chrome:
   - Go to `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"
   - Restart Chrome

2. Check model status:
   - Visit `chrome://on-device-internals`
   - Verify Gemini Nano is downloaded and ready

3. Load the extension and navigate to YouTube
   - The extension will automatically use built-in AI if available
   - Check console logs for confirmation

## Fallback Behavior

If built-in AI is not available:
1. `isBuiltInTextClassifierAvailable()` returns `false`
2. `getTextClassifier()` automatically returns server-based classifier
3. Extension continues to work using the remote API
4. No user intervention required

## Future Enhancements

Potential improvements:
- Add caching for classification results
- Implement batch size optimization for large video lists
- Add user preference to choose between built-in and server-based
- Monitor and report classification performance metrics
- Handle model download progress and inform users

## Documentation References

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Structured Output Guide](https://developer.chrome.com/docs/ai/prompt-api#structured-output)
- [Session Management Best Practices](https://developer.chrome.com/docs/ai/prompt-api#session-management)

