import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, Nurse, ShiftType } from '../../types'

const initialState: AuthState = {
  isAuthenticated: false,
  currentUser: null,
  userRole: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<Nurse>) => {
      state.isAuthenticated = true
      state.currentUser = action.payload
      state.userRole = action.payload.role
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.currentUser = null
      state.userRole = null
    },
    updateShift: (state, action: PayloadAction<ShiftType>) => {
      if (state.currentUser) {
        state.currentUser.shiftType = action.payload
      }
    },
  },
})

export const { loginSuccess, logout, updateShift } = authSlice.actions
export default authSlice.reducer
