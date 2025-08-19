// Topic logic and persistence
export function normalize(topic) {
  return (topic || '').trim().toLowerCase();
}

export function isDuplicate(topics, topic) {
  const norm = normalize(topic);
  return topics.some(t => normalize(t) === norm);
}

export function addTopic(topics, topic) {
  const norm = normalize(topic);
  if (!norm) throw 'Topic cannot be blank.';
  if (isDuplicate(topics, norm)) throw 'Topic already exists.';
  return [...topics, norm];
}

export function editTopic(topics, index, topic) {
  const norm = normalize(topic);
  if (!norm) throw 'Topic cannot be blank.';
  const dupAt = topics.findIndex((t, i) => normalize(t) === norm && i !== index);
  if (dupAt !== -1) throw 'Topic already exists.';
  const next = topics.slice();
  next[index] = norm;
  return next;
}

export function removeTopic(topics, index) {
  const next = topics.slice();
  next.splice(index, 1);
  return next;
}

export function loadTopics() {
  return new Promise(resolve => {
    chrome.storage.local.get(['topics'], res => {
      resolve(res.topics || []);
    });
  });
}

export function saveTopics(topics) {
  return new Promise(resolve => {
    chrome.storage.local.set({ topics }, resolve);
  });
}
