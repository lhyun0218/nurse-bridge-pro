import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface Hole { date: string; shift: 'Day'|'Evening'|'Night'; count: number; required: number }

interface CoverageState {
  byMonth: Record<string, { perDateShiftCounts: Record<string, { Day: number; Evening: number; Night: number }>; holes: Hole[] }>
}

const persisted = typeof localStorage !== 'undefined'
  ? JSON.parse(localStorage.getItem('scheduleCoverage') || '{}') as Record<string, { perDateShiftCounts: Record<string, { Day: number; Evening: number; Night: number }>; holes: Hole[] }>
  : {}

const initialState: CoverageState = { byMonth: persisted }

const persist = (state: CoverageState) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('scheduleCoverage', JSON.stringify(state.byMonth))
}

const slice = createSlice({
  name: 'coverage',
  initialState,
  reducers: {
    setCoverage: (state, action: PayloadAction<{ key: string; perDateShiftCounts: Record<string, { Day: number; Evening: number; Night: number }>; holes: Hole[] }>) => {
      state.byMonth[action.payload.key] = { perDateShiftCounts: action.payload.perDateShiftCounts, holes: action.payload.holes }
      persist(state)
    },
    clearCoverageForMonth: (state, action: PayloadAction<{ key: string }>) => {
      delete state.byMonth[action.payload.key]
      persist(state)
    },
  },
})

export const { setCoverage, clearCoverageForMonth } = slice.actions
export default slice.reducer
