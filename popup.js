import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { 
  getElements, setError, clearError, setInput, getInput, getSensitivity, setSensitivity, 
  renderTopics, renderTopicsCompact, setTopicEditMode, initializeButtonState, setButtonEnabled, 
  setButtonDisabled, setButtonStateFlags, getButtonState, setVideoAction, setRemoveShortsSection,
  setupVideoActionListeners, setupShortsRemovalListener, setupSensitivityListeners, 
  renderTestModeIndicator, setupEditModeListeners 
} from './popupView.js';
import { MOCK_EMBEDDING_API_CALL } from './src/embeddingConfig.js';

async function bootstrap() {
  const els = getElements();
  let topics = await loadTopics();
  let editingIndex = null;
  let editMode = false;

  // --- Topic Compact/Edit Mode Logic ---
  function showCompactMode() {
    setTopicEditMode(false);
    renderTopicsCompact(topics);
    editMode = false;
  }
  function showEditMode() {
    setTopicEditMode(true);
    renderTopics(topics, { ...handlers, editingIndex });
    editMode = true;
  }

  // Set up edit mode listeners using view function
  setupEditModeListeners(showEditMode, showCompactMode);

  // Initial render: compact mode
  showCompactMode();

  // Load video action (hide/delete) from storage and set radio button
  let videoAction = 'hide';
  try {
    const result = await chrome.storage.local.get(['videoAction']);
    videoAction = result.videoAction || 'hide';
  } catch (error) {
    console.error('Failed to load video action:', error);
  }
  
  // Set radio button state using view function
  setVideoAction(videoAction);
  
  // Set up event listeners using view functions
  setupVideoActionListeners(
    async () => {
      if (document.getElementById('action-hide')?.checked) {
        await chrome.storage.local.set({ videoAction: 'hide' });
      }
    },
    async () => {
      if (document.getElementById('action-delete')?.checked) {
        await chrome.storage.local.set({ videoAction: 'delete' });
      }
    }
  );

  // Load sensitivity from storage
  try {
    const result = await chrome.storage.local.get(['sensitivity']);
    const savedSensitivity = result.sensitivity || 0.3;
    setSensitivity(savedSensitivity);
  } catch (error) {
    console.error('Failed to load sensitivity:', error);
    setSensitivity(0.3); // Default
  }

  // Load Shorts section removal setting from storage and set checkbox
  let removeShortsSection = false;
  try {
    const result = await chrome.storage.local.get(['removeShortsSection']);
    removeShortsSection = !!result.removeShortsSection;
  } catch (error) {
    console.error('Failed to load Shorts section removal setting:', error);
  }
  
  // Set checkbox state using view function
  setRemoveShortsSection(removeShortsSection);
  
  // Set up event listener using view function
  setupShortsRemovalListener(async () => {
    const shortsCheckbox = document.getElementById('remove-shorts-section');
    if (shortsCheckbox) {
      await chrome.storage.local.set({ removeShortsSection: shortsCheckbox.checked });
    }
  });

  // Dynamically show test mode indicator if needed
  renderTestModeIndicator(MOCK_EMBEDDING_API_CALL);

  const handlers = {
    onStartEdit: (index) => {
      clearError();
      editingIndex = index;
      renderTopics(topics, { ...handlers, editingIndex });
    },
    onConfirmEdit: async (index, updated) => {
      clearError();
      try {
        const next = editTopic(topics, index, updated);
        topics = next;
        await saveTopics(topics);
        editingIndex = null;
        renderTopics(topics, { ...handlers, editingIndex });
        // Also update compact view
        renderTopicsCompact(topics);
      } catch (msg) {
        setError(String(msg));
      }
    },
    onRemove: async (index) => {
      clearError();
      const next = removeTopic(topics, index);
      topics = next;
      await saveTopics(topics);
      renderTopics(topics, { ...handlers, editingIndex });
      // Also update compact view
      renderTopicsCompact(topics);
    }
  };

  async function handleAdd() {
    clearError();
    const raw = getInput();
    try {
      const next = addTopic(topics, raw);
      topics = next;
      await saveTopics(topics);
      renderTopics(topics, { ...handlers, editingIndex });
      renderTopicsCompact(topics);
      setInput('');
    } catch (msg) {
      setError(String(msg));
    }
  }

  async function handleSensitivityChange() {
    const sensitivity = getSensitivity();
    try {
      await chrome.storage.local.set({ sensitivity });
      console.log('Sensitivity updated:', sensitivity);
    } catch (error) {
      console.error('Failed to save sensitivity:', error);
    }
  }

  // Event listeners
  els.addBtn.addEventListener('click', handleAdd);
  if (els.input) {
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    });
  }

  // Set up sensitivity slider listeners using view function
  setupSensitivityListeners(
    (percentage) => {
      // Input handler - already handled in view function
    },
    handleSensitivityChange
  );

  renderTopics(topics, { ...handlers, editingIndex });
}

document.addEventListener('DOMContentLoaded', bootstrap);


// --- Not Interested Button Integration ---
let notInterestedBtn = null;

// Check if current tab is YouTube homepage and filter state, then set button state accordingly
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

// Initialize button and set up event listeners
notInterestedBtn = initializeButtonState();
if (notInterestedBtn) {
  // Check URL and set initial button state
  checkYouTubeHomepageAndSetButtonState();
  
  // Add click event listener
  notInterestedBtn.addEventListener('click', async () => {
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
  });
}
