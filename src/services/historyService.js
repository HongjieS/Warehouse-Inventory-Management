const WORLD_FAMOUS_HISTORY_KEY = 'worldFamousHistory';
const ETERNAL_HISTORY_KEY = 'eternalHistory';

// Action types for better categorization
export const ACTION_TYPES = {
  IMPORT: 'IMPORT',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  ADJUST: 'ADJUST',
  CLEAR: 'CLEAR',
  EXPORT: 'EXPORT',
  BULK_UPDATE: 'BULK_UPDATE',
  ADD: 'ADD'
};

export const addToHistory = (type, action, items, metadata = {}) => {
  const key = type === 'worldFamous' ? WORLD_FAMOUS_HISTORY_KEY : ETERNAL_HISTORY_KEY;
  const history = getHistory(type);
  
  const entry = {
    action,
    items,
    timestamp: new Date().toISOString(),
    user: metadata.user || 'System',
    notes: metadata.notes || '',
    changes: metadata.changes || null,
    batchId: metadata.batchId || null,
    location: metadata.location || null,
    quantity: metadata.quantity || null,
    previousState: metadata.previousState || null,
    newState: metadata.newState || null
  };

  history.unshift(entry);
  
  // Keep only last 1000 entries to prevent localStorage from getting too full
  if (history.length > 1000) {
    history.pop();
  }

  localStorage.setItem(key, JSON.stringify(history));
  return history;
};

export const getHistory = (type, filters = {}) => {
  const key = type === 'worldFamous' ? WORLD_FAMOUS_HISTORY_KEY : ETERNAL_HISTORY_KEY;
  try {
    const history = localStorage.getItem(key);
    let parsedHistory = history ? JSON.parse(history) : [];
    
    // Apply filters if provided
    if (Object.keys(filters).length > 0) {
      parsedHistory = parsedHistory.filter(entry => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'dateRange') {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= value.start && entryDate <= value.end;
          }
          if (key === 'action') {
            return entry.action === value;
          }
          if (key === 'user') {
            return entry.user.toLowerCase().includes(value.toLowerCase());
          }
          if (key === 'search') {
            const searchStr = value.toLowerCase();
            return (
              entry.notes?.toLowerCase().includes(searchStr) ||
              JSON.stringify(entry.items).toLowerCase().includes(searchStr)
            );
          }
          return entry[key] === value;
        });
      });
    }
    
    return parsedHistory;
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
};

export const clearHistory = (type) => {
  const key = type === 'worldFamous' ? WORLD_FAMOUS_HISTORY_KEY : ETERNAL_HISTORY_KEY;
  localStorage.setItem(key, JSON.stringify([]));
};

export const exportHistory = (type, format = 'json') => {
  const history = getHistory(type);
  
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

export const getHistoryStats = (type) => {
  const history = getHistory(type);
  
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
}; 