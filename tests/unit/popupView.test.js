const {
  getElements,
  setError,
  clearError,
  setInput,
  getInput,
  renderTopics
} = require('../../popupView.js');

beforeEach(() => {
  document.body.innerHTML = `
    <input id="topic-input" />
    <button id="add-topic-btn"></button>
    <div id="error-msg"></div>
    <ul id="topic-list"></ul>
  `;
});

test('setError and clearError update error element', () => {
  setError('Oops');
  expect(getElements().error.textContent).toBe('Oops');
  clearError();
  expect(getElements().error.textContent).toBe('');
});

test('setInput and getInput round-trip', () => {
  setInput('abc');
  expect(getInput()).toBe('abc');
});

test('renderTopics populates list and wires callbacks', () => {
  const onStartEdit = jest.fn();
  const onRemove = jest.fn();
  renderTopics(['a', 'b'], { onStartEdit, onRemove });
  const items = [...document.querySelectorAll('#topic-list li')];
  expect(items.length).toBe(2);
  // Click edit and remove on first item
  items[0].querySelector('button').click();
  expect(onStartEdit).toHaveBeenCalledWith(0);
  items[0].querySelectorAll('button')[1].click();
  expect(onRemove).toHaveBeenCalledWith(0);
});
