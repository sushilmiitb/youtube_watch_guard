// DOM view helpers
export function getElements() {
  return {
    input: document.getElementById('topic-input'),
    addBtn: document.getElementById('add-topic-btn'),
    list: document.getElementById('topic-list'),
    error: document.getElementById('error-msg')
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

export function renderTopics(topics, { onEdit, onRemove }) {
  const { list } = getElements();
  if (!list) return;
  list.innerHTML = '';
  topics.forEach((t, index) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = t;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.marginLeft = '8px';
    editBtn.addEventListener('click', () => onEdit(index, t));

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginLeft = '6px';
    removeBtn.addEventListener('click', () => onRemove(index));

    li.appendChild(label);
    li.appendChild(editBtn);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}
