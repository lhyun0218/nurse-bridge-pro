import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Patient, Severity, VitalSigns } from '../../types'

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
    updateVitalSigns: (state, action: PayloadAction<{ patientId: string; vitalSigns: VitalSigns }>) => {
      const patient = state.allPatients.find(p => p.id === action.payload.patientId)
      if (patient) patient.vitalSigns = action.payload.vitalSigns
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    addPatient: (state, action: PayloadAction<Patient>) => {
      state.allPatients.push(action.payload)
    },
    updatePatient: (state, action: PayloadAction<Patient>) => {
      const idx = state.allPatients.findIndex(p => p.id === action.payload.id)
      if (idx !== -1) state.allPatients[idx] = action.payload
    },
  },
})

export const { setPatients, updateSeverity, updateVitalSigns, setLoading, setError, addPatient, updatePatient } = patientsSlice.actions
export default patientsSlice.reducer
