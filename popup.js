import { normalize, addTopic, editTopic, removeTopic, loadTopics, saveTopics } from './topicsModel.js';
import { getElements, setError, clearError, setInput, getInput, renderTopics } from './popupView.js';

async function bootstrap() {
  const els = getElements();
  let topics = await loadTopics();

  const handlers = {
    onEdit: async (index, current) => {
      clearError();
      const updated = window.prompt('Edit topic', current);
      if (updated == null) return; // cancel
      try {
        const next = editTopic(topics, index, updated);
        topics = next;
        await saveTopics(topics);
        renderTopics(topics, handlers);
      } catch (msg) {
        setError(String(msg));
      }
    },
    onRemove: async (index) => {
      clearError();
      const next = removeTopic(topics, index);
      topics = next;
      await saveTopics(topics);
      renderTopics(topics, handlers);
    }
  };

  els.addBtn.addEventListener('click', async () => {
    clearError();
    const raw = getInput();
    try {
      const next = addTopic(topics, raw);
      topics = next;
      await saveTopics(topics);
      renderTopics(topics, handlers);
      setInput('');
    } catch (msg) {
      setError(String(msg));
    }
  });

  renderTopics(topics, handlers);
}

document.addEventListener('DOMContentLoaded', bootstrap);
