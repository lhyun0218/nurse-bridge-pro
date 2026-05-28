import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Nurse } from '../../types'

interface NursesState {
  allNurses: Nurse[]
}

const initialState: NursesState = { allNurses: [] }

const nursesSlice = createSlice({
  name: 'nurses',
  initialState,
  reducers: {
    setNurses: (state, action: PayloadAction<Nurse[]>) => {
      state.allNurses = action.payload
    },
    reassignPatient: (state, action: PayloadAction<{ patientId: string; fromNurseId: string; toNurseId: string }>) => {
      const from = state.allNurses.find(n => n.id === action.payload.fromNurseId)
      const to   = state.allNurses.find(n => n.id === action.payload.toNurseId)
      if (from) from.assignedPatients = from.assignedPatients.filter(id => id !== action.payload.patientId)
      if (to)   to.assignedPatients.push(action.payload.patientId)
    },
  },
})

export const { setNurses, reassignPatient } = nursesSlice.actions
export default nursesSlice.reducer
