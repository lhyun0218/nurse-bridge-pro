import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Patient, Severity } from '../../types'

interface PatientsState {
  allPatients: Patient[]
  loading: boolean
  error: string | null
}

const initialState: PatientsState = {
  allPatients: [],
  loading: false,
  error: null,
}

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      state.allPatients = action.payload
    },
    updateSeverity: (state, action: PayloadAction<{ patientId: string; severity: Severity }>) => {
      const patient = state.allPatients.find(p => p.id === action.payload.patientId)
      if (patient) patient.severity = action.payload.severity
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setPatients, updateSeverity, setLoading, setError } = patientsSlice.actions
export default patientsSlice.reducer
