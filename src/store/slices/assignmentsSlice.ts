import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface AssignmentsState {
  // byDate: 'YYYY-MM-DD' -> patientId -> { Day?, Evening?, Night? }
  byDate: Record<string, Record<string, { Day?: string; Evening?: string; Night?: string }>>
}

const initialState: AssignmentsState = { byDate: {} }

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setAssignments: (state, action: PayloadAction<{ date: string; assignments: Record<string, { Day?: string; Evening?: string; Night?: string }> }>) => {
      const { date, assignments } = action.payload
      state.byDate[date] = assignments
    },
    setAssignmentsBulk: (state, action: PayloadAction<Record<string, Record<string, { Day?: string; Evening?: string; Night?: string }>>>) => {
      state.byDate = { ...state.byDate, ...action.payload }
    },
  },
})

export const { setAssignments, setAssignmentsBulk } = assignmentsSlice.actions
export default assignmentsSlice.reducer
