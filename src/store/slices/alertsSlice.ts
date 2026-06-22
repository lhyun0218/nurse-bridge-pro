import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface VitalAlert {
  id: string
  patientId: string
  patientName: string
  roomNumber: string
  type: 'danger' | 'warn' | 'info'
  message: string
  timestamp: number
}

export interface MedicationAlert {
  id: string
  patientId: string
  patientName: string
  roomNumber: string
  medicationName: string
  minutesUntilDue: number
  type: 'danger' | 'warn' | 'info'
  message: string
  timestamp: number
}

interface AlertsState {
  vitalAlerts: VitalAlert[]
  medicationAlerts: MedicationAlert[]
}

const initialState: AlertsState = {
  vitalAlerts: [],
  medicationAlerts: [],
}

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    upsertVitalAlert: (state, action: PayloadAction<VitalAlert>) => {
      const idx = state.vitalAlerts.findIndex(a => a.id === action.payload.id)
      if (idx >= 0) {
        state.vitalAlerts[idx] = action.payload
      } else {
        state.vitalAlerts.push(action.payload)
      }
    },
    removeVitalAlert: (state, action: PayloadAction<string>) => {
      state.vitalAlerts = state.vitalAlerts.filter(a => a.id !== action.payload)
    },
    clearVitalAlerts: (state) => {
      state.vitalAlerts = []
    },
    setVitalAlerts: (state, action: PayloadAction<VitalAlert[]>) => {
      state.vitalAlerts = action.payload
    },
    upsertMedicationAlert: (state, action: PayloadAction<MedicationAlert>) => {
      const idx = state.medicationAlerts.findIndex(a => a.id === action.payload.id)
      if (idx >= 0) {
        state.medicationAlerts[idx] = action.payload
      } else {
        state.medicationAlerts.push(action.payload)
      }
    },
    removeMedicationAlert: (state, action: PayloadAction<string>) => {
      state.medicationAlerts = state.medicationAlerts.filter(a => a.id !== action.payload)
    },
    clearMedicationAlerts: (state) => {
      state.medicationAlerts = []
    },
  },
})

export const {
  upsertVitalAlert,
  removeVitalAlert,
  clearVitalAlerts,
  setVitalAlerts,
  upsertMedicationAlert,
  removeMedicationAlert,
  clearMedicationAlerts,
} = alertsSlice.actions
export default alertsSlice.reducer
