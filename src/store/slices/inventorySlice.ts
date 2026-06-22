import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { InventoryItem } from '../../types'

// ── 투약 route → 재고 카테고리 매핑 ─────────────────────────────────────────
// IV 투약 → 주사기(Syringe), PO 투약 → 약컵(Other), SC/IM → 주사기, NEB → Other, O2 → Other
export type MedicationRoute = 'IV' | 'PO' | 'SC' | 'IM' | 'O2' | 'NEB' | 'Other'

// 투약 완료 시 자동 차감할 재고 카테고리 & 수량
export const MEDICATION_ROUTE_TO_INVENTORY: Record<
  MedicationRoute,
  { category: string; amount: number } | null
> = {
  IV:    { category: 'Syringe', amount: 1 },   // IV 주사 → 주사기 1개
  SC:    { category: 'Syringe', amount: 1 },   // 피하주사 → 주사기 1개
  IM:    { category: 'Syringe', amount: 1 },   // 근육주사 → 주사기 1개
  PO:    { category: 'Other',   amount: 1 },   // 경구 → 약컵(Other) 1개
  NEB:   { category: 'Other',   amount: 1 },   // 네뷸라이저 → 마스크(Other) 1개
  O2:    null,                                  // 산소 → 재고 차감 없음
  Other: null,                                  // 기타 → 재고 차감 없음
}

interface InventoryState {
  items: InventoryItem[]
  autoConsumeHistory: AutoConsumeRecord[]
}

export interface AutoConsumeRecord {
  id: string
  timestamp: string
  taskId: string
  patientId: string
  patientName: string
  medicationName: string
  route: MedicationRoute
  itemName: string
  amount: number
  nurseId: string
}

const initialState: InventoryState = {
  items: [],
  autoConsumeHistory: [],
}

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
    // 투약 완료 시 자동 재고 차감
    autoConsumeForMedication: (state, action: PayloadAction<{
      taskId: string
      patientId: string
      patientName: string
      medicationName: string
      route: MedicationRoute
      nurseId: string
    }>) => {
      const { taskId, patientId, patientName, medicationName, route, nurseId } = action.payload
      const mapping = MEDICATION_ROUTE_TO_INVENTORY[route]
      if (!mapping) return

      // 해당 카테고리의 첫 번째 sufficient/warning 아이템 차감
      const item = state.items.find(
        i => i.category === mapping.category && i.quantity > 0
      )
      if (item) {
        item.quantity = Math.max(0, item.quantity - mapping.amount)
        item.status = item.quantity === 0 ? 'critical' : item.quantity < item.reorderPoint ? 'warning' : 'sufficient'
        item.history.unshift({
          action: 'consume',
          amount: mapping.amount,
          timestamp: new Date().toISOString(),
          nurseId,
        })

        // 자동 소비 이력 기록
        state.autoConsumeHistory.unshift({
          id: `auto-${Date.now()}-${taskId}`,
          timestamp: new Date().toISOString(),
          taskId,
          patientId,
          patientName,
          medicationName,
          route,
          itemName: item.itemName,
          amount: mapping.amount,
          nurseId,
        })
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

export const { setInventory, consumeItem, autoConsumeForMedication, requestRestock } = inventorySlice.actions
export default inventorySlice.reducer
