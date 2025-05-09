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