const LANGUAGE_KEY = 'preferredLanguage';

export const LANGUAGES = {
  ENGLISH: 'en',
  MANDARIN: 'zh'
};

const translations = {
  en: {
    // General
    'Manage your inventory': 'Manage your inventory',
    'Add Item': 'Add Item',
    'Export Stock': 'Export Stock',
    'Clear Stock': 'Clear Stock',
    'Upload Invoice': 'Upload Invoice',
    'Current Stock': 'Current Stock',
    'New Import': 'New Import',
    'History': 'History',
    'Total Items': 'Total Items',
    'Total Quantity': 'Total Quantity',
    'Search in': 'Search in',
    'All Fields': 'All Fields',
    'Color': 'Color',
    'Item Code': 'Item Code',
    'Size': 'Size',
    'Actions': 'Actions',
    'Confirm Import': 'Confirm Import',
    'Clear Stock Confirmation': 'Clear Stock Confirmation',
    'Are you sure you want to clear all': 'Are you sure you want to clear all',
    'stock data? This action cannot be undone.': 'stock data? This action cannot be undone.',
    'Cancel': 'Cancel',
    'Delete Item': 'Delete Item',
    'Are you sure you want to delete this item?': 'Are you sure you want to delete this item?',
    'Item Details:': 'Item Details:',
    'Code:': 'Code:',
    'Quantity:': 'Quantity:',
    'Delete': 'Delete',
    'Switch to Mandarin': 'Switch to Mandarin',
    'Switch to English': 'Switch to English',
  },
  zh: {
    // General
    'Manage your inventory': '管理您的库存',
    'Add Item': '添加商品',
    'Export Stock': '导出库存',
    'Clear Stock': '清空库存',
    'Upload Invoice': '上传发票',
    'Current Stock': '当前库存',
    'New Import': '新导入',
    'History': '历史记录',
    'Total Items': '商品总数',
    'Total Quantity': '总数量',
    'Search in': '搜索范围',
    'All Fields': '所有字段',
    'Color': '颜色',
    'Item Code': '商品代码',
    'Size': '容量',
    'Actions': '操作',
    'Confirm Import': '确认导入',
    'Clear Stock Confirmation': '清空库存确认',
    'Are you sure you want to clear all': '您确定要清空所有',
    'stock data? This action cannot be undone.': '库存数据吗？此操作无法撤销。',
    'Cancel': '取消',
    'Delete Item': '删除商品',
    'Are you sure you want to delete this item?': '您确定要删除此商品吗？',
    'Item Details:': '商品详情：',
    'Code:': '代码：',
    'Quantity:': '数量：',
    'Delete': '删除',
    'Switch to Mandarin': '切换到中文',
    'Switch to English': '切换到英文',
  }
};

export const getCurrentLanguage = () => {
  return localStorage.getItem(LANGUAGE_KEY) || LANGUAGES.ENGLISH;
};

export const setLanguage = (language) => {
  localStorage.setItem(LANGUAGE_KEY, language);
};

export const translate = (key) => {
  const currentLanguage = getCurrentLanguage();
  return translations[currentLanguage][key] || key;
}; 