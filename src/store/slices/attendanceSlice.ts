import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface AttendanceRecord {
  nurseId: string
  date: string // YYYY-MM-DD
  checkIn?: number
  checkOut?: number
  checkoutRequested?: boolean
  checkoutApproved?: boolean
  leaveRequested?: boolean
  leaveStatus?: 'Pending' | 'Approved' | 'Denied'
  onBreak?: boolean
}

interface AttendanceState {
  records: AttendanceRecord[]
}

const initialState: AttendanceState = {
  records: [],
}

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    checkIn: (state, action: PayloadAction<{ nurseId: string; date: string; timestamp?: number }>) => {
      const { nurseId, date, timestamp } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.checkIn = timestamp ?? Date.now()
      else state.records.push({ nurseId, date, checkIn: timestamp ?? Date.now() })
    },
    requestCheckout: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
      const { nurseId, date } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.checkoutRequested = true
      else state.records.push({ nurseId, date, checkoutRequested: true })
    },
    approveCheckout: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
      const { nurseId, date } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.checkoutApproved = true
    },
    checkOut: (state, action: PayloadAction<{ nurseId: string; date: string; timestamp?: number }>) => {
      const { nurseId, date, timestamp } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.checkOut = timestamp ?? Date.now()
      else state.records.push({ nurseId, date, checkOut: timestamp ?? Date.now() })
    },
    requestLeave: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
      const { nurseId, date } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.leaveRequested = true
      else state.records.push({ nurseId, date, leaveRequested: true })
    },
    setOnBreak: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
      const { nurseId, date } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.onBreak = true
      else state.records.push({ nurseId, date, onBreak: true })
    },
    clearOnBreak: (state, action: PayloadAction<{ nurseId: string; date: string }>) => {
      const { nurseId, date } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.onBreak = false
    },
    setLeaveStatus: (state, action: PayloadAction<{ nurseId: string; date: string; status: 'Pending' | 'Approved' | 'Denied' }>) => {
      const { nurseId, date, status } = action.payload
      const rec = state.records.find(r => r.nurseId === nurseId && r.date === date)
      if (rec) rec.leaveStatus = status
    },
    // set entire records (used for hydration)
    setRecords: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.records = action.payload
    },
  },
})
export const { checkIn, requestCheckout, approveCheckout, checkOut, requestLeave, setOnBreak, clearOnBreak, setLeaveStatus, setRecords } = attendanceSlice.actions
export default attendanceSlice.reducer
