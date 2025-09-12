# Conscious YouTube

A Chrome extension that helps you have more conscious control over your YouTube recommendations by filtering out videos based on topics you want to avoid.

## Features

- **Topic Management**: Add, edit, and remove topics you want to exclude from your YouTube feed
- **Semantic Filtering**: Uses semantic similarity to intelligently filter videos (currently in test mode)
- **Sensitivity Control**: Adjust how strict the filtering should be (0-100%)
- **Real-time Filtering**: Automatically hides videos as you browse YouTube

## Current Status: Test Mode

⚠️ **The extension is currently in TEST MODE** ⚠️

- All videos are being hidden for DOM manipulation testing
- Video titles are logged to the browser console
- No actual semantic filtering is performed yet
- This mode is used to test the video hiding functionality

## Setup

### 1. Install the Extension

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

### 2. Add Topics to Exclude

1. In the extension popup, enter topics you want to avoid (e.g., "Bollywood", "cricket", "politics")
2. Click "Add" to save the topic
3. In test mode, all videos will be hidden regardless of topics

### 3. Adjust Sensitivity

Use the sensitivity slider to control how strict the filtering should be (not active in test mode):
- **Lower values (0-30%)**: Only hide videos that are very similar to excluded topics
- **Higher values (70-100%)**: Hide videos that are even remotely related to excluded topics

### 4. Run the embeddings service
https://github.com/sushilmiitb/genai_inference_apis_self_hosted

## How It Works (Test Mode)

1. **Content Analysis**: When you visit YouTube, the extension analyzes video titles on the page
2. **Test Mode**: All videos are hidden regardless of topics or sensitivity settings
3. **Console Logging**: Video titles are logged to the browser console for debugging
4. **Visual Feedback**: Hidden videos are shown with reduced opacity and a "Hidden" indicator
5. **Optimization**: Each video is processed only once to avoid duplicate API calls (important for cost control in production)

## Privacy

- All data is stored locally in Chrome's storage
- No external API calls are made in test mode
- The extension only works on YouTube domains
- Video processing is optimized to avoid duplicate API calls

## Development

### Running Tests

```bash
npm test
```

The test suite includes:
- **Unit tests** for core logic (`topicsModel.js`, `popupView.js`)
- **Content script tests** using test utilities (`tests/utils/contentScriptTestUtils.js`)
- **Embedding utilities tests** for semantic similarity functions

### Test Architecture

The project follows a clean separation of concerns:
- **Production code** (`content.js`, `popup.js`, etc.) contains only runtime logic
- **Test utilities** (`tests/utils/contentScriptTestUtils.js`) reuse common functions from production code and only override what's different for testing
- **No test-specific logic** in production code (no Jest environment checks, etc.)
- **Minimal duplication**: Common functions are imported from production code, only test-specific behavior is overridden

### Building CSS

```bash
npm run build:css
```

### Development Mode

```bash
npm run dev:css
```

### Building Content Script

```bash
npm run build:content
```

This bundles the content script and its dependencies for use in the extension. For development, you can use:

```bash
npm run dev:content
```

This will watch for changes and automatically rebuild the bundle.

## Technical Details

- **Current Mode**: Test mode with mock embeddings
- **Similarity Metric**: Cosine similarity (not used in test mode)
- **Storage**: Chrome's local storage for topics and sensitivity
- **Content Scripts**: Runs on YouTube pages to filter videos in real-time

## Troubleshooting

- **Extension not working**: Check the browser console for any error messages
- **Videos not being hidden**: Make sure you're on a YouTube page and the extension is enabled
- **Console logs**: In test mode, all video titles should be logged to the console

## Future Plans

- Implement local HuggingFace embeddings for semantic filtering
- Remove test mode and enable actual topic-based filtering
- Add more sophisticated similarity algorithms

## License

MIT License

## Credits

- Icons used in this extension are from [Heroicons](https://heroicons.com/) by the makers of Tailwind CSS.
