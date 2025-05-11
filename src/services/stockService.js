const WORLD_FAMOUS_KEY = 'worldFamousStock';
const ETERNAL_KEY = 'eternalStock';
const SOLID_INK_KEY = 'solidInkStock';

export const saveStock = (type, items) => {
  let key;
  if (type === 'worldFamous') {
    key = WORLD_FAMOUS_KEY;
  } else if (type === 'eternal') {
    key = ETERNAL_KEY;
  } else if (type === 'solidInk') {
    key = SOLID_INK_KEY;
  } else {
    throw new Error('Invalid stock type');
  }
  
  const existingStock = getStock(type);
  
  // Merge new items with existing stock
  const updatedStock = items.reduce((acc, item) => {
    const existingItem = acc.find(i => 
      i.itemCode === item.itemCode && 
      i.color === item.color && 
      i.size === item.size
    );

    if (existingItem) {
      existingItem.quantity = (parseInt(existingItem.quantity) || 0) + (parseInt(item.quantity) || 0);
      return acc;
    }

    return [...acc, { ...item, quantity: parseInt(item.quantity) || 0 }];
  }, existingStock);

  localStorage.setItem(key, JSON.stringify(updatedStock));
  return updatedStock;
};

export const getStock = (type) => {
  let key;
  if (type === 'worldFamous') {
    key = WORLD_FAMOUS_KEY;
  } else if (type === 'eternal') {
    key = ETERNAL_KEY;
  } else if (type === 'solidInk') {
    key = SOLID_INK_KEY;
  } else {
    throw new Error('Invalid stock type');
  }
  
  try {
    const stock = localStorage.getItem(key);
    return stock ? JSON.parse(stock) : [];
  } catch (error) {
    console.error('Error reading stock:', error);
    return [];
  }
};

export const clearStock = (type) => {
  let key;
  if (type === 'worldFamous') {
    key = WORLD_FAMOUS_KEY;
  } else if (type === 'eternal') {
    key = ETERNAL_KEY;
  } else if (type === 'solidInk') {
    key = SOLID_INK_KEY;
  } else {
    throw new Error('Invalid stock type');
  }
  
  localStorage.setItem(key, JSON.stringify([]));
};

export const updateStockItem = (type, itemToUpdate) => {
  const stock = getStock(type);
  const updatedStock = stock.map(item => 
    (item.itemCode === itemToUpdate.itemCode && 
     item.color === itemToUpdate.color && 
     item.size === itemToUpdate.size) 
      ? { ...item, ...itemToUpdate }
      : item
  );
  
  let key;
  if (type === 'worldFamous') {
    key = WORLD_FAMOUS_KEY;
  } else if (type === 'eternal') {
    key = ETERNAL_KEY;
  } else if (type === 'solidInk') {
    key = SOLID_INK_KEY;
  } else {
    throw new Error('Invalid stock type');
  }
  
  localStorage.setItem(key, JSON.stringify(updatedStock));
  return updatedStock;
};

export const exportStock = (type) => {
  const stock = getStock(type);
  const exportData = {
    type,
    timestamp: new Date().toISOString(),
    items: stock
  };
  return JSON.stringify(exportData, null, 2);
};

export const importStock = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.type || !data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid stock data format');
    }
    
    // Validate each item has required fields
    data.items.forEach(item => {
      if (!item.itemCode || !item.color || !item.size || item.quantity === undefined) {
        throw new Error('Invalid item data format');
      }
    });
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse stock data: ${error.message}`);
  }
};

export const setStock = (type, items) => {
  let key;
  if (type === 'worldFamous') {
    key = WORLD_FAMOUS_KEY;
  } else if (type === 'eternal') {
    key = ETERNAL_KEY;
  } else if (type === 'solidInk') {
    key = SOLID_INK_KEY;
  } else {
    throw new Error('Invalid stock type');
  }
  localStorage.setItem(key, JSON.stringify(items));
};

// Versioning system for stock
const getVersionKey = (type) => {
  if (type === 'worldFamous') return 'worldFamousStockVersions';
  if (type === 'eternal') return 'eternalStockVersions';
  if (type === 'solidInk') return 'solidInkStockVersions';
  throw new Error('Invalid stock type');
};

export function saveStockVersion(type, action, items) {
  const key = getVersionKey(type);
  const versions = getStockVersions(type);
  const version = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    action,
    items: JSON.parse(JSON.stringify(items)), // deep copy
  };
  versions.unshift(version);
  // Keep only the latest 20 versions
  if (versions.length > 20) versions.length = 20;
  localStorage.setItem(key, JSON.stringify(versions));
  return version.id;
}

export function getStockVersions(type) {
  const key = getVersionKey(type);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function restoreStockVersion(type, versionId) {
  const versions = getStockVersions(type);
  const version = versions.find(v => v.id === versionId);
  if (!version) throw new Error('Version not found');
  setStock(type, version.items);
  return version.items;
} 