import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Brand = 'World Famous' | 'Eternal'

export interface StockItem {
  description: string
  quantity: number
}

export interface HistoryEntry {
  date: string
  actionType: string
  brand: Brand
  details: any
  selected: boolean
}

interface StoreState {
  currentBrand: Brand
  worldFamousStock: StockItem[]
  eternalStock: StockItem[]
  importData: StockItem[]
  searchQuery: string
  showInStockOnly: boolean
  isEditMode: boolean
  history: HistoryEntry[]
  currentView: 'Stock' | 'History'
  tempChanges: Record<string, { originalQuantity: number; changedQuantity: number }>
  selectedSize: string
  setCurrentBrand: (brand: Brand) => void
  setWorldFamousStock: (stock: StockItem[]) => void
  setEternalStock: (stock: StockItem[]) => void
  setImportData: (data: StockItem[]) => void
  setSearchQuery: (query: string) => void
  setShowInStockOnly: (value: boolean) => void
  setIsEditMode: (value: boolean) => void
  setHistory: (history: HistoryEntry[]) => void
  setCurrentView: (view: 'Stock' | 'History') => void
  setTempChanges: (changes: Record<string, { originalQuantity: number; changedQuantity: number }>) => void
  setSelectedSize: (size: string) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentBrand: 'World Famous',
      worldFamousStock: [],
      eternalStock: [],
      importData: [],
      searchQuery: '',
      showInStockOnly: false,
      isEditMode: false,
      history: [],
      currentView: 'Stock',
      tempChanges: {},
      selectedSize: '',
      setCurrentBrand: (brand) => set({ currentBrand: brand }),
      setWorldFamousStock: (stock) => set({ worldFamousStock: stock }),
      setEternalStock: (stock) => set({ eternalStock: stock }),
      setImportData: (data) => set({ importData: data }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowInStockOnly: (value) => set({ showInStockOnly: value }),
      setIsEditMode: (value) => set({ isEditMode: value }),
      setHistory: (history) => set({ history }),
      setCurrentView: (view) => set({ currentView: view }),
      setTempChanges: (changes) => set({ tempChanges: changes }),
      setSelectedSize: (size) => set({ selectedSize: size }),
    }),
    {
      name: 'warehouse-storage',
    }
  )
) 