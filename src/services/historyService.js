// Robust, extensible, brand-agnostic history system

const HISTORY_PREFIX = 'warehouseHistory_';

export const ACTION_TYPES = {
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  ADD: 'ADD',
  CLEAR: 'CLEAR',
  ADJUST: 'ADJUST',
  BULK_UPDATE: 'BULK_UPDATE',
};

function getHistoryKey(brand) {
  return `${HISTORY_PREFIX}${brand}`;
}

export function addHistoryEntry(brand, entry) {
  const key = getHistoryKey(brand);
  const history = getHistoryEntries(brand);
  history.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  if (history.length > 1000) history.pop();
  localStorage.setItem(key, JSON.stringify(history));
}

export function getHistoryEntries(brand) {
  const key = getHistoryKey(brand);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistoryEntries(brand) {
  const key = getHistoryKey(brand);
  localStorage.setItem(key, JSON.stringify([]));
}

export function getHistoryStats(brand) {
  const history = getHistoryEntries(brand);
  return {
    totalEntries: history.length,
    actionsByType: history.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {}),
    lastUpdated: history[0]?.timestamp,
    users: [...new Set(history.map(entry => entry.user))],
    itemsAffected: history.reduce((acc, entry) => {
      const items = Array.isArray(entry.items) ? entry.items : [entry.items];
      return acc + items.length;
    }, 0)
  };
}

export const exportHistory = (type, format = 'json') => {
  const history = getHistoryEntries(type);
  if (format === 'json') {
    return JSON.stringify(history, null, 2);
  }
  if (format === 'csv') {
    const headers = ['Timestamp', 'Action', 'User', 'Notes', 'Items', 'Changes'];
    const rows = history.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.action,
      entry.user,
      entry.notes,
      JSON.stringify(entry.items),
      entry.changes ? JSON.stringify(entry.changes) : ''
    ]);
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
  return null;
}; 