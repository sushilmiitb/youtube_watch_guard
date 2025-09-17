/**
 * Hide Unwanted Videos - Logic Layer
 * Handles business logic, data management, and storage operations
 */

import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from '../../topicsModel.js';
import { 
  getElements, setError, clearError, setInput, getInput, getSensitivity, setSensitivity, 
  renderTopics, renderTopicsCompact, setTopicEditMode, setVideoAction, getVideoAction,
  setupVideoActionListeners, setupSensitivityListeners, setupEditModeListeners, setupAddTopicListeners,
  areElementsAvailable
} from './hideUnwantedView.js';
import logger from '../logger.js';

/**
 * Initialize the Hide Unwanted Videos component
 * @returns {Object} - Component interface with public methods
 */
export async function initializeHideUnwanted() {
  // Check if elements are available before proceeding
  if (!areElementsAvailable()) {
    logger.error('Required DOM elements not available for Hide Unwanted component');
    return null;
  }

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
    renderTopics(topics, { ...topicActionHandlers, editingIndex });
    editMode = true;
  }

  // Load video action (hide/delete) from storage and set radio button
  let videoAction = 'delete';
  try {
    const result = await chrome.storage.local.get(['videoAction']);
    videoAction = result.videoAction || 'delete';
    
    // If no value exists in storage, save the default
    if (result.videoAction === undefined) {
      await chrome.storage.local.set({ videoAction: 'delete' });
    }
  } catch (error) {
    logger.error('Failed to load video action:', error);
  }
  
  // Set radio button state using view function
  setVideoAction(videoAction);
  
  // Set up event listeners using view functions
  setupVideoActionListeners(
    async () => {
      const currentAction = getVideoAction();
      if (currentAction === 'hide') {
        await chrome.storage.local.set({ videoAction: 'hide' });
      }
    },
    async () => {
      const currentAction = getVideoAction();
      if (currentAction === 'delete') {
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
    logger.error('Failed to load sensitivity:', error);
    setSensitivity(0.3); // Default
  }

  const topicActionHandlers = {
    onStartEdit: (index) => {
      clearError();
      editingIndex = index;
      renderTopics(topics, { ...topicActionHandlers, editingIndex });
    },
    onConfirmEdit: async (index, updated) => {
      clearError();
      try {
        const next = editTopic(topics, index, updated);
        topics = next;
        await saveTopics(topics);
        editingIndex = null;
        renderTopics(topics, { ...topicActionHandlers, editingIndex });
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
      renderTopics(topics, { ...topicActionHandlers, editingIndex });
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
      renderTopics(topics, { ...topicActionHandlers, editingIndex });
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
      logger.info('Sensitivity updated:', sensitivity);
    } catch (error) {
      logger.error('Failed to save sensitivity:', error);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  // Set up all event listeners
  setupEditModeListeners(showEditMode, showCompactMode);
  setupAddTopicListeners(handleAdd, handleKeydown);
  setupSensitivityListeners(
    (percentage) => {
      // Input handler - already handled in view function
    },
    handleSensitivityChange
  );

  // Initial render: compact mode
  showCompactMode();
  renderTopics(topics, { ...topicActionHandlers, editingIndex });

  // Return public interface
  return {
    // Public methods for external access if needed
    getTopics: () => topics,
    getVideoAction: () => videoAction,
    getSensitivity: () => getSensitivity()
  };
}
