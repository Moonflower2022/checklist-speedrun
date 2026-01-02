// Navigation and Actionable Logic Tests
// Run with: node tests/navigation.test.js

const testData = {
  night: {
    "shower (no skipping!)": true,
    "wind down (9:15)": {
      "charge earbuds": true,
      "moisturization": true
    },
    "reflect (9:25)": {
      "how was today?": {
        "habits note": null,
        "operation note": null
      },
      "anything else notable": true
    },
    "meditate 5m": true
  },
  morning_rushed: {
    "get ready": {
      "get": {
        "earbuds": true,
        "glasses": true
      },
      "do": {
        "deodorant": true
      }
    }
  }
};

function containsTasks(item) {
  if (item === true || (item !== null && typeof item !== 'object')) return true;
  if (item === false || item === null) return false;
  if (item._checkable === true) return true;
  
  const keys = Object.keys(item).filter(k => k !== '_checkable');
  return keys.some(key => containsTasks(item[key]));
}

function isActionable(itemId, data) {
  if (!itemId) return false;
  const path = itemId.split('::');
  let value = data;
  for (const key of path) {
    if (!value || typeof value !== 'object') {
      value = undefined;
      break;
    }
    value = value[key];
  }

  if (value === undefined || value === false || value === null) return false;
  if (isPipeWrapped(itemId)) return false;

  if (value._checkable === true) return true;

  const keys = (value !== null && typeof value === 'object') ? Object.keys(value).filter(k => k !== '_checkable') : [];
  const hasChildren = keys.length > 0;

  if (hasChildren) {
    // Parent is actionable ONLY if it contains NO sub-tasks (only notes/headers)
    return !keys.some(key => containsTasks(value[key]));
  }

  return true;
}

// Simulate the core functions from todo_app.html
function generateItemId(path) {
  return path.join('::');
}

function isPipeWrapped(itemId) {
  const path = itemId.split('::');
  if (path.length === 0) return false;
  const itemText = path[path.length - 1].trim();
  return itemText.length >= 2 && itemText.startsWith('|') && itemText.endsWith('|');
}

function buildOrderedItemList(parent, path = [], list = []) {
  if (!parent || typeof parent !== 'object') return list;
  const keys = Object.keys(parent);
  for (const key of keys) {
    if (key === '_checkable') continue;
    const itemPath = [...path, key];
    const itemId = generateItemId(itemPath);
    const value = parent[key];
    list.push(itemId);
    if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
      buildOrderedItemList(value, itemPath, list);
    }
  }
  return list;
}

// Test framework
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// Tests
console.log('\n=== Navigation Tests ===\n');

test('buildOrderedItemList returns all items in order', () => {
  const list = buildOrderedItemList(testData.night);
  assert(list.length === 10, `Expected 10 items, got ${list.length}`);
  assert(list[0] === 'shower (no skipping!)', 'First item should be shower');
});

test('leaf items with true are actionable', () => {
  assert(isActionable('shower (no skipping!)', testData.night), 'shower should be actionable');
  assert(isActionable('meditate 5m', testData.night), 'meditate should be actionable');
});

test('items with null value are NOT actionable', () => {
  const id = 'reflect (9:25)::how was today?::habits note';
  assert(!isActionable(id, testData.night), 'null items should not be actionable');
});

test('parent with mixed children is NOT actionable', () => {
  const id = 'wind down (9:15)';
  assert(!isActionable(id, testData.night), 'parent with actionable children not actionable');
});

test('parent with all null children IS actionable', () => {
  const id = 'reflect (9:25)::how was today?';
  assert(isActionable(id, testData.night), 'parent with all null children should be actionable');
});

test('Get Ready parent is NOT actionable', () => {
  const id = 'get ready';
  assert(!isActionable(id, testData.morning_rushed), 'Get Ready should NOT be actionable');
});

test('Get ready -> get parent is NOT actionable', () => {
  const id = 'get ready::get';
  assert(!isActionable(id, testData.morning_rushed), 'get ready::get should NOT be actionable');
});

test('nested leaf items are actionable', () => {
  const id = 'wind down (9:15)::charge earbuds';
  assert(isActionable(id, testData.night), 'nested leaf should be actionable');
});

console.log('\n=== Arrow Navigation Tests ===\n');

function getActionableItems(data) {
  const all = buildOrderedItemList(data);
  return all.filter(id => isActionable(id, data));
}

test('getActionableItems filters correctly', () => {
  const actionable = getActionableItems(testData.night);
  // shower, charge earbuds, moisturization, how was today?, anything else, meditate
  assert(actionable.length === 6, `Expected 6 actionable, got ${actionable.length}`);
});

test('arrow navigation includes parent with null children', () => {
  const actionable = getActionableItems(testData.night);
  const hasHowWasToday = actionable.some(id => id.includes('how was today?'));
  assert(hasHowWasToday, '"how was today?" should be in navigation');
});

console.log('\n=== Edge Case Tests ===\n');

// Test navigation simulation
function simulateMoveDown(currentId, data) {
  const allItems = buildOrderedItemList(data);
  const currentIndex = allItems.indexOf(currentId);

  for (let i = currentIndex + 1; i < allItems.length; i++) {
    if (isActionable(allItems[i], data)) return allItems[i];
  }
  for (let i = 0; i <= currentIndex; i++) {
    if (isActionable(allItems[i], data)) return allItems[i];
  }
  return null;
}

function simulateMoveUp(currentId, data) {
  const allItems = buildOrderedItemList(data);
  const currentIndex = allItems.indexOf(currentId);

  for (let i = currentIndex - 1; i >= 0; i--) {
    if (isActionable(allItems[i], data)) return allItems[i];
  }
  for (let i = allItems.length - 1; i >= currentIndex; i--) {
    if (isActionable(allItems[i], data)) return allItems[i];
  }
  return null;
}

test('moveDown from first item goes to second actionable', () => {
  const next = simulateMoveDown('shower (no skipping!)', testData.night);
  assert(next === 'wind down (9:15)::charge earbuds', `Got: ${next}`);
});

test('moveUp from last item wraps to previous actionable', () => {
  const prev = simulateMoveUp('meditate 5m', testData.night);
  assert(prev === 'reflect (9:25)::anything else notable', `Got: ${prev}`);
});

test('moveDown wraps around at end', () => {
  const next = simulateMoveDown('meditate 5m', testData.night);
  assert(next === 'shower (no skipping!)', `Got: ${next}`);
});

test('moveUp wraps around at start', () => {
  const prev = simulateMoveUp('shower (no skipping!)', testData.night);
  assert(prev === 'meditate 5m', `Got: ${prev}`);
});

test('navigation skips parent with actionable children', () => {
  const actionable = getActionableItems(testData.night);
  const hasWindDown = actionable.includes('wind down (9:15)');
  assert(!hasWindDown, 'wind down parent should not be actionable');
});

test('parent with all null children is actionable', () => {
  const data = { "question": { "note1": null, "note2": null } };
  assert(isActionable('question', data), 'parent with all null children should be actionable');
});

console.log('\n=== Completion Logic Tests ===\n');

// Simulate isItemCompleted with actionable check
function isItemCompleted(item, path, completedItems, data) {
  const itemId = path.join('::');

  if (item === false || item === null || isPipeWrapped(itemId)) return true;

  const keys = (item !== null && typeof item === 'object') ? Object.keys(item).filter(k => k !== '_checkable') : [];
  
  if (itemId && completedItems.has(itemId)) return true;

  if (isActionable(itemId, data)) return completedItems.has(itemId);

  for (const key of keys) {
    if (!isItemCompleted(item[key], [...path, key], completedItems, data)) {
      return false;
    }
  }
  return true;
}

test('item with all null children is NOT completed by default', () => {
  const data = { "question": { "note1": null, "note2": null } };
  const completed = new Set();
  const result = isItemCompleted(data.question, ['question'], completed, data);
  assert(!result, 'should not be completed without explicit check');
});

test('item with all null children IS completed when in completedItems', () => {
  const data = { "question": { "note1": null, "note2": null } };
  const completed = new Set(['question']);
  const result = isItemCompleted(data.question, ['question'], completed, data);
  assert(result, 'should be completed when explicitly checked');
});

test('item with all null children IS completed when in completedItems', () => {
  const data = { "question": { "note1": null, "note2": null } };
  const completed = new Set(['question']);
  const result = isItemCompleted(data.question, ['question'], completed, data);
  assert(result, 'should be completed when explicitly checked');
});

test('regular leaf item completion works correctly', () => {
  const data = { "task": true };
  const completed = new Set();
  assert(!isItemCompleted(true, ['task'], completed, data), 'unchecked leaf not completed');
  completed.add('task');
  assert(isItemCompleted(true, ['task'], completed, data), 'checked leaf is completed');
});

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
