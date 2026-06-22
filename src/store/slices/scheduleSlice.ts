import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { NurseScheduleRow } from '../../types'

interface ScheduleState {
  saved: Record<string, NurseScheduleRow[]>
}

const persisted = typeof localStorage !== 'undefined'
  ? JSON.parse(localStorage.getItem('savedSchedule') || '{}') as Record<string, NurseScheduleRow[]>
  : {}

const initialState: ScheduleState = {
  saved: persisted,
}

const persistSchedules = (state: ScheduleState) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('savedSchedule', JSON.stringify(state.saved))
  }
}

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    saveSchedule: (state, action: PayloadAction<{ year: number; month: number; rows: NurseScheduleRow[] }>) => {
      const key = `${action.payload.year}-${String(action.payload.month).padStart(2, '0')}`
      state.saved[key] = action.payload.rows
      persistSchedules(state)
    },
    updateShift: (state, action: PayloadAction<{ year: number; month: number; nurseId: string; dayIndex: number; shift: NurseScheduleRow['shifts'][number] }>) => {
      const key = `${action.payload.year}-${String(action.payload.month).padStart(2, '0')}`
      const rows = state.saved[key]
      if (!rows) return
      const row = rows.find(r => r.nurseId === action.payload.nurseId)
      if (!row) return
      row.shifts[action.payload.dayIndex] = action.payload.shift

      const dayCount = row.shifts.filter(s => s === 'D').length
      const eveningCount = row.shifts.filter(s => s === 'E').length
      const nightCount = row.shifts.filter(s => s === 'N').length
      const offCount = row.shifts.filter(s => s === 'OFF').length
      const weekendWork = row.shifts.reduce((acc, shift, idx) => {
        const date = new Date(action.payload.year, action.payload.month - 1, idx + 1)
        const dow = date.getDay()
        return acc + (shift !== 'OFF' && (dow === 0 || dow === 6) ? 1 : 0)
      }, 0)

      row.stats = {
        dayCount,
        eveningCount,
        nightCount,
        offCount,
        weekendWork,
        overtimeRisk: dayCount + eveningCount + nightCount > 22,
      }

      persistSchedules(state)
    },
  },
})

export const { saveSchedule, updateShift } = scheduleSlice.actions
export default scheduleSlice.reducer
