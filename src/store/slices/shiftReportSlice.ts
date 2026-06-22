import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ShiftReport } from '../../types'

interface ShiftReportState {
  reports: ShiftReport[]
}

const initialState: ShiftReportState = {
  reports: [],
}

const shiftReportSlice = createSlice({
  name: 'shiftReports',
  initialState,
  reducers: {
    saveShiftReport: (state, action: PayloadAction<ShiftReport>) => {
      // 같은 reportId가 있으면 덮어씀
      const idx = state.reports.findIndex(r => r.reportId === action.payload.reportId)
      if (idx >= 0) {
        state.reports[idx] = action.payload
      } else {
        state.reports.unshift(action.payload)  // 최신순
      }
    },
    deleteShiftReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter(r => r.reportId !== action.payload)
    },
    clearShiftReports: (state) => {
      state.reports = []
    },
    // set reports for hydration
    setReports: (state, action: PayloadAction<ShiftReport[]>) => {
      state.reports = action.payload
    },
  },
})

export const { saveShiftReport, deleteShiftReport, clearShiftReports, setReports } = shiftReportSlice.actions
export default shiftReportSlice.reducer
