import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { getElements, setError, clearError, setInput, getInput, getSensitivity, setSensitivity, renderTopics, renderTopicsCompact, setTopicEditMode } from './popupView.js';
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

  // Wire up edit button
  const editBtn = document.getElementById('topic-edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', showEditMode);
  }
  // Wire up done button in edit section
  const doneBtn = document.getElementById('topic-edit-done-btn');
  if (doneBtn) {
    doneBtn.addEventListener('click', showCompactMode);
  }

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
  // Set radio button state
  const hideRadio = document.getElementById('action-hide');
  const deleteRadio = document.getElementById('action-delete');
  if (hideRadio && deleteRadio) {
    hideRadio.checked = videoAction === 'hide';
    deleteRadio.checked = videoAction === 'delete';
    hideRadio.addEventListener('change', async () => {
      if (hideRadio.checked) {
        await chrome.storage.local.set({ videoAction: 'hide' });
      }
    });
    deleteRadio.addEventListener('change', async () => {
      if (deleteRadio.checked) {
        await chrome.storage.local.set({ videoAction: 'delete' });
      }
    });
  }

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
  const shortsCheckbox = document.getElementById('remove-shorts-section');
  if (shortsCheckbox) {
    shortsCheckbox.checked = removeShortsSection;
    shortsCheckbox.addEventListener('change', async () => {
      await chrome.storage.local.set({ removeShortsSection: shortsCheckbox.checked });
    });
  }

  // Dynamically show test mode indicator if needed
  if (MOCK_EMBEDDING_API_CALL) {
    const warning = document.createElement('div');
    warning.className = 'mb-4 p-3 bg-warning rounded-lg';
    warning.innerHTML = `
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span class="text-sm font-medium">TEST MODE</span>
      </div>
      <p class="text-xs mt-1">All videos will be hidden for DOM manipulation testing. Check console for video titles.</p>
    `;
    document.body.insertBefore(warning, document.body.children[1]);
  }

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

  // Sensitivity slider event listener
  if (els.sensitivitySlider) {
    els.sensitivitySlider.addEventListener('input', (e) => {
      const percentage = e.target.value;
      els.sensitivityValue.textContent = `${percentage}%`;
    });

    els.sensitivitySlider.addEventListener('change', handleSensitivityChange);
  }

  renderTopics(topics, { ...handlers, editingIndex });
}

document.addEventListener('DOMContentLoaded', bootstrap);

// --- Not Interested Button Integration ---
const notInterestedBtn = document.getElementById('not-interested-btn');
if (notInterestedBtn) {
  notInterestedBtn.addEventListener('click', async () => {
    // Check if the active tab is the YouTube homepage first
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;
      const url = tab.url.replace(/\/$/, ''); // Remove trailing slash
      if (url === 'https://www.youtube.com' || url === 'https://youtube.com') {
        const confirmed = confirm('Are you sure you want to mark the first 10 videos as Not Interested? This action cannot be undone.');
        if (!confirmed) return;
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'markNotInterested', count: 10 });
        }
        window.close();
      } else {
        alert('The "Mark now" feature only works on the YouTube homepage. Please open https://www.youtube.com/ and try again.');
      }
    });
  });
}
