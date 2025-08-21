import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { getElements, setError, clearError, setInput, getInput, getSensitivity, setSensitivity, renderTopics } from './popupView.js';
import { MOCK_EMBEDDING_API_CALL } from './src/embeddingConfig.js';

async function bootstrap() {
  const els = getElements();
  let topics = await loadTopics();
  let editingIndex = null;

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
