import { addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { getElements, setError, clearError, setInput, getInput, renderTopics } from './popupView.js';

async function bootstrap() {
  const els = getElements();
  let topics = await loadTopics();
  let editingIndex = null;

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

  els.addBtn.addEventListener('click', handleAdd);
  if (els.input) {
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    });
  }

  renderTopics(topics, { ...handlers, editingIndex });
}

document.addEventListener('DOMContentLoaded', bootstrap);
