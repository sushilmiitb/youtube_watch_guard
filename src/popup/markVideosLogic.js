/**
 * Mark Videos Not Interested - Logic Layer
 * Handles business logic and communication with content scripts
 */

import { 
  initializeButtonState, setButtonEnabled, setButtonDisabled, 
  setButtonStateFlags, getButtonState, setupButtonClickListener 
} from './markVideosView.js';

/**
 * Initialize the Mark Videos Not Interested component
 * @returns {Object} - Component interface with public methods
 */
export async function initializeMarkVideos() {
  // Initialize button and set up event listeners
  const notInterestedBtn = initializeButtonState();
  
  if (notInterestedBtn) {
    // Check URL and set initial button state
    await checkYouTubeHomepageAndSetButtonState();
    
    // Add click event listener
    setupButtonClickListener(handleButtonClick);
  }

  // Return public interface
  return {
    // Public methods for external access if needed
    getButtonState: () => getButtonState()
  };
}

/**
 * Check if current tab is YouTube homepage and filter state, then set button state accordingly
 */
async function checkYouTubeHomepageAndSetButtonState() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      setButtonDisabled('Unable to determine current page');
      return;
    }
    
    const url = tab.url.replace(/\/$/, ''); // Remove trailing slash
    const isYouTubeHomepage = url === 'https://www.youtube.com' || url === 'https://youtube.com';
    
    if (!isYouTubeHomepage) {
      setButtonStateFlags(false, false);
      setButtonDisabled('The "Mark now" feature only works on the YouTube homepage. Please open https://www.youtube.com/ and try again.');
      return;
    }
    
    // If we're on YouTube homepage, check the filter state via message passing
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getFilterState' });
      if (response && response.isAll) {
        setButtonStateFlags(true, true);
        setButtonDisabled('The "Mark now" feature only works when a specific category filter is selected. Please select a category other than "All" and try again.');
      } else {
        setButtonStateFlags(true, false);
        setButtonEnabled();
      }
    } catch (error) {
      console.error('Error checking filter state:', error);
      setButtonStateFlags(false, false);
      setButtonDisabled('Unable to determine filter state. Please ensure you are on the YouTube homepage.');
    }
  });
}

/**
 * Handle button click event
 */
async function handleButtonClick() {
  const buttonState = getButtonState();
  if (!buttonState.isOnYouTubeHomepage || buttonState.isFilterSetToAll) {
    return; // Button is disabled, do nothing
  }
  
  const confirmed = confirm('Are you sure you want to mark the first 10 videos as Not Interested? This action cannot be undone.');
  if (!confirmed) return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'markNotInterested', count: 10 });
      window.close();
    }
  });
}
