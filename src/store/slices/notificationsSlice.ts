import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type NotificationType = 'danger' | 'warn' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  /** 연관 환자 ID (선택) */
  patientId?: string
  patientName?: string
  roomNumber?: string
}

interface NotificationsState {
  items: Notification[]
}

const initialState: NotificationsState = {
  items: [],
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'read'>>) => {
      const idx = state.items.findIndex(n => n.id === action.payload.id)
      if (idx >= 0) {
        // 이미 존재하면 내용 업데이트 (읽음 상태 유지)
        state.items[idx] = { ...action.payload, read: state.items[idx].read }
      } else {
        state.items.unshift({ ...action.payload, read: false })
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find(n => n.id === action.payload)
      if (n) n.read = true
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.read = true })
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(n => n.id !== action.payload)
    },
    clearAllNotifications: (state) => {
      state.items = []
    },
    // set notifications (hydration)
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload
    },
  },
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAllNotifications,
  setNotifications,
} = notificationsSlice.actions
export default notificationsSlice.reducer
