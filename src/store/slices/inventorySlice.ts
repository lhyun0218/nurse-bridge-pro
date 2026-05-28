import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { InventoryItem } from '../../types'

interface InventoryState {
  items: InventoryItem[]
}

const initialState: InventoryState = { items: [] }

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventory: (state, action: PayloadAction<InventoryItem[]>) => {
      state.items = action.payload
    },
    consumeItem: (state, action: PayloadAction<{ itemId: string; amount: number; nurseId: string }>) => {
      const item = state.items.find(i => i.itemId === action.payload.itemId)
      if (item) {
        item.quantity = Math.max(0, item.quantity - action.payload.amount)
        item.status = item.quantity === 0 ? 'critical' : item.quantity < item.reorderPoint ? 'warning' : 'sufficient'
        item.history.unshift({ action: 'consume', amount: action.payload.amount, timestamp: new Date().toISOString(), nurseId: action.payload.nurseId })
      }
    },
    requestRestock: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.itemId === action.payload)
      if (item) {
        item.history.unshift({ action: 'request', amount: 0, timestamp: new Date().toISOString() })
      }
    },
  },
})

export const { setInventory, consumeItem, requestRestock } = inventorySlice.actions
export default inventorySlice.reducer
