import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Prescription } from '../../types'

interface PrescriptionsState {
  items: Prescription[]
}

const initialState: PrescriptionsState = { items: [] }

const prescriptionsSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    setPrescriptions: (state, action: PayloadAction<Prescription[]>) => {
      state.items = action.payload
    },
    addPrescription: (state, action: PayloadAction<Prescription>) => {
      state.items.unshift(action.payload)
    },
    verifyPrescription: (state, action: PayloadAction<string>) => {
      const p = state.items.find(p => p.id === action.payload)
      if (p) p.verified = true
    },
    discontinuePrescription: (state, action: PayloadAction<string>) => {
      const p = state.items.find(p => p.id === action.payload)
      if (p) p.status = 'discontinued'
    },
    updateNurseNote: (state, action: PayloadAction<{ id: string; note: string }>) => {
      const p = state.items.find(p => p.id === action.payload.id)
      if (p) p.nurseNote = action.payload.note
    },
  },
})

export const {
  setPrescriptions,
  addPrescription,
  verifyPrescription,
  discontinuePrescription,
  updateNurseNote,
} = prescriptionsSlice.actions
export default prescriptionsSlice.reducer
