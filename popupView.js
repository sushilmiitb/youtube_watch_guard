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
  const template = document.getElementById('topic-list-item-template');

  topics.forEach((t, index) => {
    let li;
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
      li = document.createElement('li');
      li.className = 'flex items-center justify-between px-2 py-1 rounded';
      li.appendChild(row);
    } else {
      // Read mode: clone from template
      if (template && template.content) {
        li = template.content.firstElementChild.cloneNode(true);
        li.querySelector('.topic-label').textContent = t;
        li.querySelector('.edit-btn').addEventListener('click', () => onStartEdit(index));
        li.querySelector('.remove-btn').addEventListener('click', () => onRemove(index));
      } else {
        // fallback to old method if template not found
        li = document.createElement('li');
        li.className = 'flex items-center justify-between px-2 py-1 rounded';
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
    }
    list.appendChild(li);
  });
}

/**
 * Render the topics as a single comma-separated line in compact mode.
 * @param {string[]} topics
 */
export function renderTopicsCompact(topics) {
  const compactRow = document.getElementById('topic-compact-row');
  const compactList = document.getElementById('topic-compact-list');
  if (!compactRow || !compactList) return;
  if (topics.length === 0) {
    compactList.textContent = 'No topics added.';
  } else {
    compactList.textContent = topics.join(', ');
  }
  // Remove any truncation styling to ensure all topics are visible
  compactList.classList.remove('truncate');
}

/**
 * Show/hide the compact and edit sections.
 * @param {boolean} editMode
 */
export function setTopicEditMode(editMode) {
  const compactRow = document.getElementById('topic-compact-row');
  const editSection = document.getElementById('topic-edit-section');
  if (compactRow && editSection) {
    compactRow.style.display = editMode ? 'none' : '';
    editSection.style.display = editMode ? '' : 'none';
  }
}

// --- Button State Management ---
let notInterestedBtn = null;
let isOnYouTubeHomepage = false;
let isFilterSetToAll = false;

/**
 * Initialize button state management
 */
export function initializeButtonState() {
  notInterestedBtn = document.getElementById('not-interested-btn');
  return notInterestedBtn;
}

/**
 * Set tooltip text for the button
 * @param {string} text - Tooltip text
 */
export function setTooltipText(text) {
  if (!notInterestedBtn) return;
  notInterestedBtn.setAttribute('data-tip', text);
}

/**
 * Clear tooltip text
 */
export function clearTooltip() {
  if (!notInterestedBtn) return;
  notInterestedBtn.setAttribute('data-tip', '');
}

/**
 * Enable the button and remove tooltip
 */
export function setButtonEnabled() {
  if (!notInterestedBtn) return;
  isOnYouTubeHomepage = true;
  isFilterSetToAll = false;
  notInterestedBtn.disabled = false;
  notInterestedBtn.classList.remove('btn-disabled');
  notInterestedBtn.classList.remove('tooltip');
  clearTooltip();
  notInterestedBtn.style.setProperty('cursor', 'pointer', 'important');
  notInterestedBtn.style.pointerEvents = 'auto';
}

/**
 * Disable the button and add tooltip
 * @param {string} tooltipText - Text to show in tooltip
 */
export function setButtonDisabled(tooltipText) {
  if (!notInterestedBtn) return;
  notInterestedBtn.disabled = true;
  notInterestedBtn.classList.add('btn-disabled');
  notInterestedBtn.classList.add('tooltip');
  setTooltipText(tooltipText);
  notInterestedBtn.style.setProperty('cursor', 'not-allowed', 'important');
  notInterestedBtn.style.pointerEvents = 'auto';
}

/**
 * Get current button state
 */
export function getButtonState() {
  return {
    isOnYouTubeHomepage,
    isFilterSetToAll,
    isDisabled: notInterestedBtn ? notInterestedBtn.disabled : true
  };
}

/**
 * Set button state flags
 * @param {boolean} onHomepage - Whether on YouTube homepage
 * @param {boolean} filterAll - Whether filter is set to "All"
 */
export function setButtonStateFlags(onHomepage, filterAll) {
  isOnYouTubeHomepage = onHomepage;
  isFilterSetToAll = filterAll;
}

// --- Storage UI Management ---

/**
 * Set video action radio buttons
 * @param {string} action - 'hide' or 'delete'
 */
export function setVideoAction(action) {
  const hideRadio = document.getElementById('action-hide');
  const deleteRadio = document.getElementById('action-delete');
  if (hideRadio && deleteRadio) {
    hideRadio.checked = action === 'hide';
    deleteRadio.checked = action === 'delete';
  }
}

/**
 * Set Shorts section removal checkbox
 * @param {boolean} enabled - Whether to remove Shorts sections
 */
export function setRemoveShortsSection(enabled) {
  const shortsCheckbox = document.getElementById('remove-shorts-section');
  if (shortsCheckbox) {
    shortsCheckbox.checked = enabled;
  }
}

/**
 * Set up video action change listeners
 * @param {Function} onHideChange - Callback for hide radio change
 * @param {Function} onDeleteChange - Callback for delete radio change
 */
export function setupVideoActionListeners(onHideChange, onDeleteChange) {
  const hideRadio = document.getElementById('action-hide');
  const deleteRadio = document.getElementById('action-delete');
  
  if (hideRadio) {
    hideRadio.addEventListener('change', onHideChange);
  }
  if (deleteRadio) {
    deleteRadio.addEventListener('change', onDeleteChange);
  }
}

/**
 * Set up Shorts section removal listener
 * @param {Function} onChange - Callback for checkbox change
 */
export function setupShortsRemovalListener(onChange) {
  const shortsCheckbox = document.getElementById('remove-shorts-section');
  if (shortsCheckbox) {
    shortsCheckbox.addEventListener('change', onChange);
  }
}

/**
 * Set up sensitivity slider listeners
 * @param {Function} onInput - Callback for slider input
 * @param {Function} onChange - Callback for slider change
 */
export function setupSensitivityListeners(onInput, onChange) {
  const { sensitivitySlider, sensitivityValue } = getElements();
  
  if (sensitivitySlider) {
    sensitivitySlider.addEventListener('input', (e) => {
      const percentage = e.target.value;
      if (sensitivityValue) {
        sensitivityValue.textContent = `${percentage}%`;
      }
      onInput(percentage);
    });
    
    sensitivitySlider.addEventListener('change', onChange);
  }
}

/**
 * Render test mode indicator
 * @param {boolean} show - Whether to show the indicator
 */
export function renderTestModeIndicator(show) {
  if (!show) return;
  
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

// --- Edit Mode Management ---

/**
 * Set up edit mode event listeners
 * @param {Function} onEditClick - Callback for edit button click
 * @param {Function} onDoneClick - Callback for done button click
 */
export function setupEditModeListeners(onEditClick, onDoneClick) {
  const editBtn = document.getElementById('topic-edit-btn');
  const doneBtn = document.getElementById('topic-edit-done-btn');
  
  if (editBtn) {
    editBtn.addEventListener('click', onEditClick);
  }
  if (doneBtn) {
    doneBtn.addEventListener('click', onDoneClick);
  }
}

