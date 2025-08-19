const {
  normalize,
  isDuplicate,
  addTopic,
  editTopic,
  removeTopic
} = require('../../topicsModel.js');

describe('topicsModel logic', () => {
  test('normalize trims and lowercases', () => {
    expect(normalize('  Cricket  ')).toBe('cricket');
  });

  test('addTopic rejects blank', () => {
    expect(() => addTopic([], '   ')).toThrow('Topic cannot be blank.');
  });

  test('addTopic rejects duplicate (case-insensitive)', () => {
    expect(() => addTopic(['cricket'], 'CRICKET')).toThrow('Topic already exists.');
  });

  test('addTopic appends normalized topic', () => {
    expect(addTopic([], '  Cricket ')).toEqual(['cricket']);
  });

  test('editTopic updates and enforces duplicates', () => {
    const updated = editTopic(['cricket', 'music'], 0, 'football');
    expect(updated).toEqual(['football', 'music']);
    expect(() => editTopic(['cricket', 'music'], 0, 'MUSIC')).toThrow('Topic already exists.');
  });

  test('removeTopic removes by index', () => {
    expect(removeTopic(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });
});
