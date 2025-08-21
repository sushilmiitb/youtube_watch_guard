import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { getElements, setError, clearError, setInput, getInput, getSensitivity, setSensitivity, renderTopics } from './popupView.js';

async function bootstrap() {
  const els = getElements();
  let topics = await loadTopics();
  let editingIndex = null;

  // Load sensitivity from storage
  try {
    const result = await chrome.storage.local.get(['sensitivity']);
    const savedSensitivity = result.sensitivity || 0.3;
    setSensitivity(savedSensitivity);
  } catch (error) {
    console.error('Failed to load sensitivity:', error);
    setSensitivity(0.3); // Default
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
