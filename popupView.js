// DOM view helpers
export function getElements() {
  return {
    input: document.getElementById('topic-input'),
    addBtn: document.getElementById('add-topic-btn'),
    list: document.getElementById('topic-list'),
    error: document.getElementById('error-msg'),
    sensitivitySlider: document.getElementById('sensitivity-slider'),
    sensitivityValue: document.getElementById('sensitivity-value')
  };
}

export function setError(message) {
  const { error } = getElements();
  if (error) error.textContent = message || '';
}

export function clearError() {
  setError('');
}

export function setInput(value) {
  const { input } = getElements();
  if (input) input.value = value;
}

export function getInput() {
  const { input } = getElements();
  return input ? input.value : '';
}

export function getSensitivity() {
  const { sensitivitySlider } = getElements();
  if (sensitivitySlider) {
    return parseInt(sensitivitySlider.value) / 100; // Convert percentage to decimal
  }
  return 0.3; // Default 30%
}

export function setSensitivity(value) {
  const { sensitivitySlider, sensitivityValue } = getElements();
  if (sensitivitySlider && sensitivityValue) {
    const percentage = Math.round(value * 100);
    sensitivitySlider.value = percentage;
    sensitivityValue.textContent = `${percentage}%`;
  }
}

export function renderTopics(topics, { editingIndex = null, onStartEdit, onConfirmEdit, onRemove }) {
  const { list } = getElements();
  if (!list) return;
  list.innerHTML = '';
  topics.forEach((t, index) => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between px-2 py-1 rounded';

    if (editingIndex === index) {
      // Edit mode: single row with input + confirm button, tight spacing
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 w-full';

      const input = document.createElement('input');
      input.className = 'input input-bordered input-sm flex-1';
      input.value = t;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirmEdit(index, input.value);
        }
      });

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'btn btn-sm btn-success text-success-content';
      confirmBtn.setAttribute('aria-label', 'Confirm');
      confirmBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>`;
      confirmBtn.addEventListener('click', () => onConfirmEdit(index, input.value));

      row.appendChild(input);
      row.appendChild(confirmBtn);
      li.appendChild(row);
    } else {
      // Read mode: label + edit/remove icons
      const label = document.createElement('span');
      label.textContent = t;

      const controls = document.createElement('div');
      controls.className = 'flex gap-1';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-xs btn-ghost text-primary';
      editBtn.setAttribute('aria-label', 'Edit');
      editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM18.012 7.012 7.5 17.525V21h3.475L21.487 10.487l-3.475-3.475Z"/></svg>`;
      editBtn.addEventListener('click', () => onStartEdit(index));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-xs btn-ghost text-error';
      removeBtn.setAttribute('aria-label', 'Remove');
      removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Zm3-4h6l1 1h4v2H4V4h4l1-1Zm1 7h2v9h-2V10Zm4 0h2v9h-2V10Z"/></svg>`;
      removeBtn.addEventListener('click', () => onRemove(index));

      li.appendChild(label);
      controls.appendChild(editBtn);
      controls.appendChild(removeBtn);
      li.appendChild(controls);
    }

    list.appendChild(li);
  });
}
